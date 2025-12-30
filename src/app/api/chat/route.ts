import { streamText, convertToModelMessages, stepCountIs } from 'ai'

import { openai } from '@/lib/ai/openai'
import { createCFOSystemPrompt } from '@/lib/ai/prompts'
import { createProfileTools } from '@/lib/ai/tools'
import { createClient } from '@/lib/supabase/server'

import type { UIMessage } from 'ai'

interface ChatRequest {
  messages: UIMessage[]
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
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create system prompt with agency context
    const systemPrompt = createCFOSystemPrompt({
      agencyName: profile?.agency_name ?? null,
      employeeCount: profile?.employee_count ?? null,
      revenueRange: profile?.annual_revenue_range ?? null,
    })

    // Convert UI messages to model messages format for streamText
    const modelMessages = await convertToModelMessages(messages)

    // Create profile tools for conversational data input
    const tools = createProfileTools(supabase, user.id)

    // Stream response using AI SDK with GPT-5.2
    // stopWhen controls when to stop multi-step tool calls
    const result = streamText({
      model: openai('gpt-5.2'),
      messages: modelMessages,
      system: systemPrompt,
      tools,
      stopWhen: stepCountIs(3),
    })

    // Return UI message stream response for useChat hook compatibility
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[ChatAPI]', { error: error instanceof Error ? error.message : 'Unknown error' })

    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
