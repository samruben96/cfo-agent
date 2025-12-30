import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import {
  createConversation,
  getConversations,
  getConversation,
  saveMessage,
  updateConversationTitle,
  getMostRecentConversation,
} from './service'

describe('ConversationService', () => {
  const mockUserId = 'user-123'
  const mockConversationId = 'conv-456'
  const mockConversation = {
    id: mockConversationId,
    user_id: mockUserId,
    title: 'Test Conversation',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }
  const mockMessage = {
    id: 'msg-789',
    conversation_id: mockConversationId,
    role: 'user' as const,
    content: 'Hello',
    created_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockSupabase = () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    return mockSupabase
  }

  describe('createConversation', () => {
    it('creates a conversation successfully', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({ data: mockConversation, error: null })

      const result = await createConversation(mockUserId, 'Test Conversation')

      expect(result.data).toEqual(mockConversation)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Test Conversation',
      })
    })

    it('creates a conversation without title', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({ data: mockConversation, error: null })

      await createConversation(mockUserId)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: null,
      })
    })

    it('handles database errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await createConversation(mockUserId)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to create conversation')
    })
  })

  describe('getConversations', () => {
    it('returns conversations ordered by updated_at descending', async () => {
      const mockSupabase = createMockSupabase()
      const conversations = [mockConversation]
      // For getConversations, the chain ends with order(), not single()
      mockSupabase.order.mockResolvedValue({ data: conversations, error: null })

      const result = await getConversations(mockUserId)

      expect(result.data).toEqual(conversations)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUserId)
      expect(mockSupabase.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    })

    it('handles database errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getConversations(mockUserId)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to fetch conversations')
    })
  })

  describe('getConversation', () => {
    it('returns conversation with messages', async () => {
      const mockSupabase = createMockSupabase()
      const messages = [mockMessage]

      // First call for conversation, second for messages
      mockSupabase.single.mockResolvedValueOnce({ data: mockConversation, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: messages, error: null })

      const result = await getConversation(mockConversationId)

      expect(result.data).toEqual({
        ...mockConversation,
        messages,
      })
      expect(result.error).toBeNull()
    })

    it('handles conversation not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const result = await getConversation(mockConversationId)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Conversation not found')
    })

    it('handles message fetch errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValueOnce({ data: mockConversation, error: null })
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getConversation(mockConversationId)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to fetch messages')
    })
  })

  describe('saveMessage', () => {
    it('saves a message and updates conversation timestamp', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({ data: mockMessage, error: null })
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await saveMessage(mockConversationId, 'user', 'Hello')

      expect(result.data).toEqual(mockMessage)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('chat_messages')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        conversation_id: mockConversationId,
        role: 'user',
        content: 'Hello',
      })
    })

    it('handles database errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await saveMessage(mockConversationId, 'user', 'Hello')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to save message')
    })
  })

  describe('updateConversationTitle', () => {
    it('updates the conversation title', async () => {
      const mockSupabase = createMockSupabase()
      const updatedConversation = { ...mockConversation, title: 'New Title' }
      mockSupabase.single.mockResolvedValue({ data: updatedConversation, error: null })

      const result = await updateConversationTitle(mockConversationId, 'New Title')

      expect(result.data).toEqual(updatedConversation)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' })
      )
    })

    it('handles database errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await updateConversationTitle(mockConversationId, 'New Title')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to update conversation title')
    })
  })

  describe('getMostRecentConversation', () => {
    it('returns the most recent conversation with messages', async () => {
      const messages = [mockMessage]
      // getMostRecentConversation uses a more complex chain:
      // .from().select().eq().order().limit().single()
      // Then a second query for messages: .from().select().eq().order()
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: mockConversation, error: null }),
      }
      // After first query (conversation), the second query is for messages
      // We need to handle the second call chain differently
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          // Second call: chat_messages query
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: messages, error: null }),
              }),
            }),
          }
        }
        return mockSupabase
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

      const result = await getMostRecentConversation(mockUserId)

      expect(result.data).toEqual({
        ...mockConversation,
        messages,
      })
      expect(result.error).toBeNull()
    })

    it('returns null data when no conversations exist', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows', code: 'PGRST116' },
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

      const result = await getMostRecentConversation(mockUserId)

      expect(result.data).toBeNull()
      expect(result.error).toBeNull() // Not an error - just no conversations
    })

    it('handles database errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'OTHER' },
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

      const result = await getMostRecentConversation(mockUserId)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to fetch recent conversation')
    })
  })
})
