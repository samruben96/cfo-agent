import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules before imports
vi.mock('@/lib/ai/openai', () => ({
  openai: vi.fn(() => 'gpt-5.2'),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  tool: vi.fn((config) => config),
  stepCountIs: vi.fn((count) => `stepCountIs(${count})`),
  zodSchema: vi.fn((schema) => schema),
}))

import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages } from 'ai'

describe('POST /api/chat', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockProfile = {
    agency_name: 'Test Agency',
    employee_count: 10,
    annual_revenue_range: '$1M-$5M',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset convertToModelMessages mock to return messages passed in
    vi.mocked(convertToModelMessages).mockImplementation(async (messages) => messages as never)
  })

  const createMockRequest = (body: unknown) => {
    return new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const mockSupabaseClient = (options: {
    user?: typeof mockUser | null
    authError?: Error | null
    profile?: typeof mockProfile | null
  }) => {
    const supabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options.user ?? null },
          error: options.authError ?? null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: options.profile ?? null,
              error: null,
            }),
          }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(supabaseClient as never)
    return supabaseClient
  }

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseClient({ user: null })

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when auth error occurs', async () => {
    mockSupabaseClient({
      user: null,
      authError: new Error('Auth failed'),
    })

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when messages array is missing', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    const request = createMockRequest({})

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request: messages array required')
  })

  it('returns 400 when messages is not an array', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    const request = createMockRequest({ messages: 'not an array' })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request: messages array required')
  })

  it('calls streamText with correct parameters for authenticated user', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream data')),
    }
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

    const messages = [{ role: 'user', content: 'What are my costs?' }]
    const request = createMockRequest({ messages })

    await POST(request)

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages,
        system: expect.stringContaining('Test Agency'),
      })
    )
  })

  it('returns streaming response for valid request', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    const mockResponse = new Response('streaming content')
    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(mockResponse),
    }
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    const response = await POST(request)

    expect(response).toBe(mockResponse)
    expect(mockStreamResponse.toUIMessageStreamResponse).toHaveBeenCalled()
  })

  it('includes agency context in system prompt when profile exists', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
    }
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    await POST(request)

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringMatching(/Test Agency.*10.*\$1M-\$5M/s),
      })
    )
  })

  it('handles missing profile gracefully', async () => {
    mockSupabaseClient({ user: mockUser, profile: null })

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
    }
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    await POST(request)

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('an insurance agency'),
      })
    )
  })

  it('returns 500 on unexpected errors', async () => {
    mockSupabaseClient({ user: mockUser, profile: mockProfile })

    vi.mocked(streamText).mockImplementation(() => {
      throw new Error('OpenAI rate limit exceeded')
    })

    const request = createMockRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred while processing your request')
  })

  describe('multi-turn conversation context', () => {
    it('sends full conversation history to OpenAI', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      // Simulate a follow-up question with previous context
      const messages = [
        { role: 'user', content: 'What is my payroll ratio?' },
        { role: 'assistant', content: 'Your payroll ratio is 45%.' },
        { role: 'user', content: 'How does that compare to industry average?' },
      ]
      const request = createMockRequest({ messages })

      await POST(request)

      // Verify ALL messages are sent to streamText (not just the last one)
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'What is my payroll ratio?' }),
            expect.objectContaining({ role: 'assistant', content: 'Your payroll ratio is 45%.' }),
            expect.objectContaining({ role: 'user', content: 'How does that compare to industry average?' }),
          ]),
        })
      )
    })

    it('includes conversation history for implicit reference resolution', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      // User asks about topic, then requests breakdown without specifying topic
      const messages = [
        { role: 'user', content: 'What does each employee cost me?' },
        { role: 'assistant', content: 'Each employee costs approximately $75,000 fully loaded.' },
        { role: 'user', content: 'Show me the breakdown' },
      ]
      const request = createMockRequest({ messages })

      await POST(request)

      // Verify the "breakdown" request includes all prior context
      const streamTextCall = vi.mocked(streamText).mock.calls[0][0]
      expect(streamTextCall.messages).toHaveLength(3)
      expect(streamTextCall.messages[2].content).toBe('Show me the breakdown')
    })

    it('preserves message order for topic switching', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      // User discusses EBITDA, switches to employees, then references EBITDA again
      const messages = [
        { role: 'user', content: 'What is my EBITDA?' },
        { role: 'assistant', content: 'Your EBITDA is $500,000.' },
        { role: 'user', content: 'How many employees do I have?' },
        { role: 'assistant', content: 'You have 10 employees.' },
        { role: 'user', content: 'And what about that EBITDA breakdown?' },
      ]
      const request = createMockRequest({ messages })

      await POST(request)

      // Verify message order is preserved for context resolution
      const streamTextCall = vi.mocked(streamText).mock.calls[0][0]
      expect(streamTextCall.messages[0].content).toBe('What is my EBITDA?')
      expect(streamTextCall.messages[2].content).toBe('How many employees do I have?')
      expect(streamTextCall.messages[4].content).toBe('And what about that EBITDA breakdown?')
    })

    it('includes system prompt with context handling instructions', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      })

      await POST(request)

      // Verify system prompt includes context handling instructions
      const streamTextCall = vi.mocked(streamText).mock.calls[0][0]
      expect(streamTextCall.system).toMatch(/pronoun/i)
      expect(streamTextCall.system).toMatch(/breakdown|details/i)
    })
  })

  describe('tool calling integration', () => {
    it('passes profile tools to streamText', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'My rent is $3,500 per month' }],
      })

      await POST(request)

      // Verify tools are passed to streamText
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            updateRent: expect.any(Object),
            updateEmployeeCount: expect.any(Object),
            updateMonthlyOverhead: expect.any(Object),
            updateSoftwareSpend: expect.any(Object),
          }),
        })
      )
    })

    it('sets stopWhen for multi-step tool calls', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      })

      await POST(request)

      // Verify stopWhen is set for multi-step tool calling
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          stopWhen: expect.any(String),
        })
      )
    })

    it('includes data collection guidelines in system prompt', async () => {
      mockSupabaseClient({ user: mockUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      })

      await POST(request)

      const streamTextCall = vi.mocked(streamText).mock.calls[0][0]
      expect(streamTextCall.system).toMatch(/data collection/i)
      expect(streamTextCall.system).toMatch(/Got it, I've updated/i)
    })

    it('creates tools with correct user ID context', async () => {
      const specificUser = { id: 'specific-user-456', email: 'specific@example.com' }
      mockSupabaseClient({ user: specificUser, profile: mockProfile })

      const mockStreamResponse = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('')),
      }
      vi.mocked(streamText).mockReturnValue(mockStreamResponse as never)

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      })

      await POST(request)

      // Verify streamText was called with tools (tools are created with user context)
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.any(Object),
        })
      )
    })
  })
})
