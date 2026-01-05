'use client'

import { useState, useRef, useMemo, useEffect, useCallback, FormEvent } from 'react'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { toast } from 'sonner'

import { History, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getToastError } from '@/lib/errors/friendly-errors'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatContainer, ChatMessage, ChatInput, TypingIndicator, EmptyState, NewConversationButton, ConversationHistoryPanel, DocumentAnnouncement, DocumentsSidePanel, type FileProcessingState, type SelectedDocumentInfo, type MessageDocumentRef } from '@/components/chat'
import { useConversation } from '@/hooks/use-conversation'
import { parseSuggestions } from '@/lib/ai/parse-suggestions'
import { generateSmartSummary, generateSuggestedQuestions } from '@/lib/documents/smart-summary'
import { uploadDocument, processCSV, processPDF, getDocuments } from '@/actions/documents'

import type { UIMessage } from 'ai'
import type { Document } from '@/types/documents'

interface ChatClientProps {
  initialConversationId?: string
  /** Document ID to start a "Chat about this" session - AC #15 */
  initialDocumentId?: string
  /** Whether this is an error resolution session - AC #17, #18 */
  isErrorResolution?: boolean
  className?: string
  onConversationChange?: (conversationId: string | undefined) => void
}

export function ChatClient({
  initialConversationId,
  initialDocumentId,
  isErrorResolution = false,
  className,
  onConversationChange
}: ChatClientProps) {
  // Note: agencyName, employeeCount, revenueRange props removed - profile data
  // is fetched server-side in /api/chat route for security (prevents client manipulation)

  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)
  const [input, setInput] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isDocsPanelOpen, setIsDocsPanelOpen] = useState(false)
  const lastInputRef = useRef('')

  // Document context state for "Chat about this" flow - AC #15
  const [contextDocument, setContextDocument] = useState<Document | null>(null)
  const [documentLoading, setDocumentLoading] = useState(!!initialDocumentId)
  const hasLoadedDocumentRef = useRef(false)

  // File upload state - AC #1, #2
  const [processingFile, setProcessingFile] = useState<FileProcessingState | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null)

  // Multi-select documents for chat reference
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])

  // Load conversation history when conversationId changes
  const { conversation, isLoading: isLoadingHistory } = useConversation(conversationId)

  // Convert database messages to UI messages format
  const initialMessages: UIMessage[] | undefined = useMemo(() => {
    if (!conversation?.messages) return undefined
    return conversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      parts: [{ type: 'text' as const, text: msg.content }],
      createdAt: new Date(msg.created_at),
    }))
  }, [conversation?.messages])

  // Custom fetch wrapper to capture conversation ID from response headers
  const customFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, init)

    // Capture conversation ID from API response headers
    // This is critical for persisting subsequent messages to the same conversation
    const newConversationId = response.headers.get('X-Conversation-Id')
    if (newConversationId && newConversationId !== conversationId) {
      setConversationId(newConversationId)
      onConversationChange?.(newConversationId)
    }

    return response
  }, [conversationId, onConversationChange])

  // Combine single contextDocument (from URL param) with multi-selected documents
  const allDocumentIds = useMemo(() => {
    return contextDocument?.id
      ? [contextDocument.id, ...selectedDocumentIds.filter(id => id !== contextDocument.id)]
      : selectedDocumentIds
  }, [contextDocument?.id, selectedDocumentIds])

  // Use refs to avoid stale closure issues in the transport's fetch function
  // This ensures the fetch always gets the latest values when called
  const allDocumentIdsRef = useRef(allDocumentIds)
  const conversationIdRef = useRef(conversationId)

  // Keep refs in sync with state
  useEffect(() => {
    allDocumentIdsRef.current = allDocumentIds
  }, [allDocumentIds])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  // Create custom transport that includes our extra body fields
  // Using refs inside fetch to always get latest values (avoids stale closure)
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (input, init) => {
        // Parse existing body and add our custom fields
        let body: Record<string, unknown> = {}
        if (init?.body) {
          body = JSON.parse(init.body as string)
        }

        // Add our custom fields - use refs to get current values
        const currentDocIds = allDocumentIdsRef.current
        const currentConvId = conversationIdRef.current

        body.conversationId = currentConvId
        body.documentIds = currentDocIds.length > 0 ? currentDocIds : undefined
        body.isErrorResolution = isErrorResolution

        // Call our custom fetch (which handles response headers)
        return customFetch(input, {
          ...init,
          body: JSON.stringify(body),
        })
      },
    })
  }, [customFetch, isErrorResolution]) // Note: refs don't need to be in deps - they're always current

  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages
  } = useChat({
    transport,
    onError: (err) => {
      // Use conversational error messages
      const friendlyError = getToastError(err, 'chat')
      toast.error(friendlyError.title, { description: friendlyError.description })

      console.error('[ChatClient]', { error: err?.message || 'Unknown error' })
      // Restore input on error
      setInput(lastInputRef.current)
    }
  })

  // Set initial messages when conversation history is loaded
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages, setMessages])

  // Load document for "Chat about this" flow - AC #15
  useEffect(() => {
    if (!initialDocumentId || hasLoadedDocumentRef.current) return

    const loadDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${initialDocumentId}`)
        if (!response.ok) {
          throw new Error('Failed to load document')
        }
        const document = await response.json()
        setContextDocument(document)
        hasLoadedDocumentRef.current = true
      } catch (error) {
        console.error('[ChatClient] Failed to load document:', error)
        const friendlyError = getToastError(error, 'api_request')
        toast.error(friendlyError.title, { description: friendlyError.description })
      } finally {
        setDocumentLoading(false)
      }
    }

    loadDocument()
  }, [initialDocumentId])

  // Load documents for side panel - AC #12
  useEffect(() => {
    const loadDocuments = async () => {
      const { data, error } = await getDocuments()
      if (error) {
        console.error('[ChatClient] Failed to load documents:', error)
        return
      }
      if (data) {
        setDocuments(data)
      }
    }

    loadDocuments()
  }, [])

  // Handle file upload - AC #1, #2
  const handleFileSelect = useCallback(async (file: File) => {
    setProcessingFile({ file, status: 'uploading' })

    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      const uploadResult = await uploadDocument(formData)

      if (uploadResult.error || !uploadResult.data) {
        setProcessingFile({ file, status: 'error', error: uploadResult.error || 'Upload failed' })
        return
      }

      const doc = uploadResult.data
      setProcessingFile({ file, status: 'processing', documentId: doc.id })

      // Process based on file type
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const processResult = await processPDF(doc.id)
        if (processResult.error) {
          setProcessingFile({ file, status: 'error', error: processResult.error })
          return
        }
      } else {
        const processResult = await processCSV(doc.id)
        if (processResult.error) {
          setProcessingFile({ file, status: 'error', error: processResult.error })
          return
        }
      }

      // Fetch updated document with extracted data
      const response = await fetch(`/api/documents/${doc.id}`)
      if (response.ok) {
        const updatedDoc = await response.json()
        setUploadedDocument(updatedDoc)
        setDocuments(prev => [updatedDoc, ...prev.filter(d => d.id !== updatedDoc.id)])
      }

      setProcessingFile({ file, status: 'complete', documentId: doc.id })

      // Clear processing state after a brief delay to show success
      setTimeout(() => {
        setProcessingFile(null)
      }, 1500)
    } catch (error) {
      console.error('[ChatClient] File upload error:', error)
      const friendlyError = getToastError(error, 'document_upload')
      const errorMessage = friendlyError.description
        ? `${friendlyError.title}: ${friendlyError.description}`
        : friendlyError.title
      setProcessingFile({ file, status: 'error', error: errorMessage })
    }
  }, [])

  // Convert selected document IDs to display info for chat input
  const selectedDocumentsInfo: SelectedDocumentInfo[] = useMemo(() => {
    return selectedDocumentIds
      .map(id => {
        const doc = documents.find(d => d.id === id)
        if (!doc || doc.processingStatus !== 'completed') return null
        const summary = generateSmartSummary(doc)
        return {
          id: doc.id,
          filename: doc.filename,
          title: summary.title,
          fileType: doc.fileType
        }
      })
      .filter((d): d is SelectedDocumentInfo => d !== null)
  }, [selectedDocumentIds, documents])

  // Handle removing a selected document
  const handleRemoveDocument = useCallback((documentId: string) => {
    setSelectedDocumentIds(prev => prev.filter(id => id !== documentId))
  }, [])

  // Handle starting a new conversation
  const handleNewConversation = useCallback(() => {
    setConversationId(undefined)
    setMessages([])
    onConversationChange?.(undefined)
  }, [setMessages, onConversationChange])

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback((selectedId: string) => {
    setConversationId(selectedId)
    setMessages([]) // Clear messages - they will be loaded by useConversation
    onConversationChange?.(selectedId)
  }, [setMessages, onConversationChange])

  // error is tracked by useChat but toast handles user notification in onError callback
  void error

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      lastInputRef.current = input
      const messageText = input
      setInput('')
      sendMessage({ text: messageText })
    }
  }

  // Handle empty state example question clicks - pre-fill input
  const handleExampleQuestionClick = (question: string) => {
    setInput(question)
  }

  // Handle suggested question clicks - send directly as a new message
  const handleSuggestionClick = (question: string) => {
    if (isLoading) return
    lastInputRef.current = question
    sendMessage({ text: question })
  }

  // Parse suggestions from the last assistant message
  // Only show suggestions when last message is from assistant AND not loading
  const lastMessageSuggestions = useMemo(() => {
    // Don't show suggestions while loading (prevents stale suggestions flash)
    if (isLoading) return []
    if (messages.length === 0) return []

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant') return []

    // Get the full text content from the message
    const content = lastMessage.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('')

    return parseSuggestions(content)
  }, [messages, isLoading])

  // Show new conversation button when there are messages (user has an active conversation)
  const showNewConversationButton = messages.length > 0

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Chat header with History (left), New Conversation (center), Documents (right) */}
      <div className="flex items-center px-4 py-2 border-b">
        {/* Left: History button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHistoryOpen(true)}
                aria-label="View conversation history"
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Conversation History</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Center: New Conversation button (or spacer) */}
        <div className="flex-1 flex justify-center">
          {showNewConversationButton && (
            <NewConversationButton
              onClick={handleNewConversation}
              disabled={isLoading || isLoadingHistory}
            />
          )}
        </div>

        {/* Right: Documents panel button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDocsPanelOpen(true)}
                aria-label="View documents"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Documents</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ChatContainer className="flex-1">
        {documentLoading ? (
          // Show loading state while fetching document context
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading document...
          </div>
        ) : isLoadingHistory && conversationId ? (
          // Show loading state while fetching conversation history
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading conversation...
          </div>
        ) : messages.length === 0 && (contextDocument || uploadedDocument) ? (
          // Show document announcement for "Chat about this" flow - AC #15
          // Or for newly uploaded document - AC #9
          (() => {
            const doc = contextDocument || uploadedDocument!
            const isStillProcessing = doc.processingStatus === 'processing'
            const summary = generateSmartSummary(doc)
            const questions = isStillProcessing
              ? ['What is this document about?', 'What should I expect from this data?']
              : generateSuggestedQuestions(summary)

            return (
              <DocumentAnnouncement
                summary={summary}
                suggestedQuestions={questions}
                onQuestionClick={handleSuggestionClick}
                isProcessing={isStillProcessing}
                filename={doc.filename}
                isPDF={doc.fileType === 'pdf'}
              />
            )
          })()
        ) : messages.length === 0 ? (
          <EmptyState onQuestionClick={handleExampleQuestionClick} />
        ) : (
          <>
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1
              const isAssistant = message.role === 'assistant'
              const isComplete = !isLoading || !isLastMessage
              const isUser = !isAssistant

              // Only show suggestions on the last assistant message when complete
              const showSuggestions = isLastMessage && isAssistant && isComplete

              // Show document refs for user messages (only when documents are selected)
              // Maps SelectedDocumentInfo to MessageDocumentRef format
              const documentRefs: MessageDocumentRef[] | undefined = isUser && selectedDocumentsInfo.length > 0
                ? selectedDocumentsInfo.map(d => ({ id: d.id, title: d.title, fileType: d.fileType }))
                : undefined

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  variant={isAssistant ? 'assistant' : 'user'}
                  suggestions={showSuggestions ? lastMessageSuggestions : undefined}
                  onSuggestionClick={showSuggestions ? handleSuggestionClick : undefined}
                  isComplete={isComplete}
                  documentRefs={documentRefs}
                />
              )
            })}
            {isLoading && <TypingIndicator />}
          </>
        )}
      </ChatContainer>
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading || isLoadingHistory}
        onFileSelect={handleFileSelect}
        processingFile={processingFile}
        selectedDocuments={selectedDocumentsInfo}
        onRemoveDocument={handleRemoveDocument}
      />

      {/* Conversation History Panel */}
      <ConversationHistoryPanel
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        selectedConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
      />

      {/* Documents Side Panel - AC #12 */}
      <DocumentsSidePanel
        open={isDocsPanelOpen}
        onClose={() => setIsDocsPanelOpen(false)}
        documents={documents}
        selectedDocumentIds={selectedDocumentIds}
        onSelectionChange={setSelectedDocumentIds}
      />
    </div>
  )
}

// Export for use by conversation context
export type { ChatClientProps }
