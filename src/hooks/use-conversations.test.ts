import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/client'
import { useConversations } from './use-conversations'

describe('useConversations', () => {
  const mockUser = { id: 'user-123' }
  const mockConversations = [
    {
      id: 'conv-1',
      user_id: mockUser.id,
      title: 'First conversation',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
    {
      id: 'conv-2',
      user_id: mockUser.id,
      title: 'Second conversation',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockSupabase = (options: {
    user?: typeof mockUser | null
    conversations?: typeof mockConversations | null
    error?: { message: string } | null
  }) => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options.user === null ? null : (options.user ?? mockUser) },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: options.conversations === null ? null : (options.conversations ?? mockConversations),
                error: options.error ?? null,
              }),
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase as never)
    return mockSupabase
  }

  it('fetches conversations on mount', async () => {
    createMockSupabase({})

    const { result } = renderHook(() => useConversations())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conversations).toEqual(mockConversations)
    expect(result.current.error).toBeNull()
  })

  it('sets error when user is not authenticated', async () => {
    createMockSupabase({ user: null })

    const { result } = renderHook(() => useConversations())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conversations).toEqual([])
    expect(result.current.error).toBe('Not authenticated')
  })

  it('handles fetch errors', async () => {
    createMockSupabase({ error: { message: 'Database error' } })

    const { result } = renderHook(() => useConversations())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch conversations')
  })

  it('allows refetching conversations', async () => {
    const mockSupabase = createMockSupabase({})

    const { result } = renderHook(() => useConversations())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Call refetch
    await result.current.refetch()

    // Should have called supabase twice
    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })
})
