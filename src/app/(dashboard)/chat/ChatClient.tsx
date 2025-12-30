'use client'

import { useState, useRef, useMemo, useEffect, useCallback, FormEvent } from 'react'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { toast } from 'sonner'

import { History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatContainer, ChatMessage, ChatInput, TypingIndicator, EmptyState, NewConversationButton, ConversationHistoryPanel } from '@/components/chat'
import { useConversation } from '@/hooks/use-conversation'
import { parseSuggestions } from '@/lib/ai/parse-suggestions'

import type { UIMessage } from 'ai'

interface ChatClientProps {
  initialConversationId?: string
  className?: string
  onConversationChange?: (conversationId: string | undefined) => void
}

export function ChatClient({
  initialConversationId,
  className,
  onConversationChange
}: ChatClientProps) {
  // Note: agencyName, employeeCount, revenueRange props removed - profile data
  // is fetched server-side in /api/chat route for security (prevents client manipulation)

  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)
  const [input, setInput] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const lastInputRef = useRef('')

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

  // Create transport with dynamic body to pass conversationId
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      fetch: customFetch,
      body: () => ({
        conversationId,
      }),
    })
  }, [conversationId, customFetch])

  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages
  } = useChat({
    transport,
    onError: (err) => {
      // Differentiate error types for better user feedback
      const errorMessage = err?.message?.toLowerCase() || ''

      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Too many requests. Please wait a moment and try again.')
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        toast.error('Session expired. Please refresh the page.')
      } else {
        toast.error('Failed to send message. Please try again.')
      }

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
      {/* Chat header with History and New Conversation buttons */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
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
        {showNewConversationButton && (
          <NewConversationButton
            onClick={handleNewConversation}
            disabled={isLoading || isLoadingHistory}
          />
        )}
      </div>
      <ChatContainer className="flex-1">
        {isLoadingHistory && conversationId ? (
          // Show loading state while fetching conversation history
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onQuestionClick={handleExampleQuestionClick} />
        ) : (
          <>
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1
              const isAssistant = message.role === 'assistant'
              const isComplete = !isLoading || !isLastMessage

              // Only show suggestions on the last assistant message when complete
              const showSuggestions = isLastMessage && isAssistant && isComplete

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  variant={isAssistant ? 'assistant' : 'user'}
                  suggestions={showSuggestions ? lastMessageSuggestions : undefined}
                  onSuggestionClick={showSuggestions ? handleSuggestionClick : undefined}
                  isComplete={isComplete}
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
      />

      {/* Conversation History Panel */}
      <ConversationHistoryPanel
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        selectedConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  )
}

// Export for use by conversation context
export type { ChatClientProps }
