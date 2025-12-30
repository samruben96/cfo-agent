import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/client'
import { useConversation } from './use-conversation'

describe('useConversation', () => {
  const mockConversationId = 'conv-123'
  const mockConversation = {
    id: mockConversationId,
    user_id: 'user-123',
    title: 'Test conversation',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }
  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: mockConversationId,
      role: 'user',
      content: 'Hello',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'msg-2',
      conversation_id: mockConversationId,
      role: 'assistant',
      content: 'Hi there!',
      created_at: '2025-01-01T00:00:01Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockSupabase = (options: {
    conversation?: typeof mockConversation | null
    messages?: typeof mockMessages
    conversationError?: { message: string } | null
    messageError?: { message: string } | null
  }) => {
    let callCount = 0
    const mockSupabase = {
      from: vi.fn().mockImplementation((table) => {
        callCount++
        if (table === 'conversations' || callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: options.conversation ?? mockConversation,
                  error: options.conversationError ?? null,
                }),
              }),
            }),
          }
        }
        // chat_messages
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: options.messages ?? mockMessages,
                error: options.messageError ?? null,
              }),
            }),
          }),
        }
      }),
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase as never)
    return mockSupabase
  }

  it('returns null when conversationId is undefined', async () => {
    createMockSupabase({})

    const { result } = renderHook(() => useConversation(undefined))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conversation).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches conversation with messages', async () => {
    createMockSupabase({})

    const { result } = renderHook(() => useConversation(mockConversationId))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conversation).toEqual({
      ...mockConversation,
      messages: mockMessages,
    })
    expect(result.current.error).toBeNull()
  })

  it('handles conversation not found', async () => {
    createMockSupabase({
      conversation: null,
      conversationError: { message: 'Not found' },
    })

    const { result } = renderHook(() => useConversation(mockConversationId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conversation).toBeNull()
    expect(result.current.error).toBe('Conversation not found')
  })

  it('handles message fetch errors', async () => {
    createMockSupabase({
      messageError: { message: 'Database error' },
    })

    const { result } = renderHook(() => useConversation(mockConversationId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch messages')
  })

  it('refetches when conversationId changes', async () => {
    const mockSupabase = createMockSupabase({})

    const { result, rerender } = renderHook(
      ({ id }) => useConversation(id),
      { initialProps: { id: mockConversationId } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Change conversationId
    rerender({ id: 'new-conv-id' })

    // Should trigger a new fetch
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledTimes(4) // 2 initial + 2 after rerender
    })
  })
})
