import { streamText, convertToModelMessages, stepCountIs } from 'ai'

import { openai } from '@/lib/ai/openai'
import { createCFOSystemPrompt, type DocumentContext } from '@/lib/ai/prompts'
import { createProfileTools, createEmployeeCostTools } from '@/lib/ai/tools'
import {
  createConversation,
  saveMessage,
  updateConversationTitle,
} from '@/lib/conversations'
import { generateSmartSummary } from '@/lib/documents/smart-summary'
import { createClient } from '@/lib/supabase/server'
import { getPDFSchemaType, transformRowToDocument } from '@/types/documents'

import type { UIMessage } from 'ai'
import type { DocumentRow } from '@/types/documents'

interface ChatRequest {
  messages: UIMessage[]
  conversationId?: string
  /** Document IDs for multi-select document reference */
  documentIds?: string[]
  /** Whether this is an error resolution session - AC #17, #18 */
  isErrorResolution?: boolean
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_name, employee_count, annual_revenue_range')
      .eq('id', user.id)
      .single()

    // Parse request body
    const body = await req.json() as ChatRequest
    const { messages, conversationId: requestConversationId, documentIds, isErrorResolution } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle conversation persistence
    let activeConversationId = requestConversationId

    // Create conversation if not provided
    if (!activeConversationId) {
      const { data: newConv, error: convError } = await createConversation(user.id)
      if (convError || !newConv) {
        console.error('[ChatAPI]', { action: 'createConversation', error: convError })
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
      activeConversationId = newConv.id
    }

    // Get the latest user message and save it
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()
    if (latestUserMessage) {
      // Extract text content from message parts
      const textContent = latestUserMessage.parts
        ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('') || ''

      if (textContent) {
        const { error: saveError } = await saveMessage(
          activeConversationId,
          'user',
          textContent
        )
        if (saveError) {
          console.error('[ChatAPI]', { action: 'saveUserMessage', error: saveError })
          // Continue anyway - don't fail the request
        }

        // Auto-generate title from first message if conversation is new
        if (!requestConversationId) {
          const title = textContent.length > 50 ? textContent.substring(0, 47) + '...' : textContent
          await updateConversationTitle(activeConversationId, title)
        }
      }
    }

    // Fetch document contexts if documentIds provided (supports multi-select)
    const documentContexts: DocumentContext[] = []
    if (documentIds && documentIds.length > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds)
        .eq('user_id', user.id)

      if (docs) {
        for (const doc of docs) {
          // Transform database row to Document type
          const document = transformRowToDocument(doc as DocumentRow)

          // Generate smart summary
          const summary = generateSmartSummary(document)

          // Determine document type
          let documentType = 'csv'
          if (document.fileType === 'pdf') {
            documentType = getPDFSchemaType(document.extractedData) || 'pdf'
          } else if (document.csvType) {
            documentType = document.csvType
          }

          documentContexts.push({
            filename: document.filename,
            fileType: document.fileType,
            documentType,
            extractedData: document.extractedData ?? null,
            isProcessing: document.processingStatus === 'processing',
            summary: {
              title: summary.title,
              metrics: summary.metrics,
              itemCount: summary.itemCount,
              dateRange: summary.dateRange,
            },
          })
        }
      }
    }

    // Get error message from first document if in error resolution mode
    const errorMessage = isErrorResolution && documentIds && documentIds.length > 0
      ? (await supabase
          .from('documents')
          .select('error_message')
          .eq('id', documentIds[0])
          .single()
        ).data?.error_message
      : null

    // Create system prompt with agency and document context
    const systemPrompt = createCFOSystemPrompt({
      agencyName: profile?.agency_name ?? null,
      employeeCount: profile?.employee_count ?? null,
      revenueRange: profile?.annual_revenue_range ?? null,
      documentContexts: documentContexts.length > 0 ? documentContexts : undefined,
      isErrorResolution,
      errorMessage,
    })

    // Convert UI messages to model messages format for streamText
    const modelMessages = await convertToModelMessages(messages)

    // Create tools for AI - profile updates and employee cost calculations
    const profileTools = createProfileTools(supabase, user.id)
    const employeeCostTools = createEmployeeCostTools()
    const tools = { ...profileTools, ...employeeCostTools }

    // Stream response using AI SDK with GPT-5.2
    // stopWhen controls when to stop multi-step tool calls
    // onFinish saves the assistant response to the database
    const result = streamText({
      model: openai('gpt-5.2'),
      messages: modelMessages,
      system: systemPrompt,
      tools,
      stopWhen: stepCountIs(3),
      onFinish: async ({ text }) => {
        // Save assistant response to database
        if (text && activeConversationId) {
          const { error } = await saveMessage(activeConversationId, 'assistant', text)
          if (error) {
            console.error('[ChatAPI]', { action: 'saveAssistantMessage', error })
          }
        }
      },
    })

    // Return UI message stream response for useChat hook compatibility
    // Include conversationId in response headers for client to use
    const response = result.toUIMessageStreamResponse()

    // Clone the response to add custom headers
    const headers = new Headers(response.headers)
    headers.set('X-Conversation-Id', activeConversationId)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error) {
    console.error('[ChatAPI]', { error: error instanceof Error ? error.message : 'Unknown error' })

    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
