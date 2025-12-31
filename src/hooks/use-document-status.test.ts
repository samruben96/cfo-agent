import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act, cleanup } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/client'
import { useDocumentStatus } from './use-document-status'

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { DocumentRow } from '@/types/documents'

describe('useDocumentStatus', () => {
  const mockUserId = 'user-123'
  let mockChannel: Partial<RealtimeChannel>
  let subscribeCallback: ((status: string, err?: Error) => void) | null = null
  let postgresChangesCallback: ((payload: RealtimePostgresChangesPayload<DocumentRow>) => void) | null = null

  const setupMockSupabase = (options: {
    user?: { id: string } | null
    authError?: { message: string } | null
    subscribeImmediately?: boolean
  } = {}) => {
    subscribeCallback = null
    postgresChangesCallback = null
    const { subscribeImmediately = true } = options

    mockChannel = {
      on: vi.fn().mockImplementation((_event, _config, callback) => {
        postgresChangesCallback = callback
        return mockChannel
      }),
      subscribe: vi.fn().mockImplementation((callback) => {
        subscribeCallback = callback
        // Call callback immediately (synchronously) by default for easier testing
        if (subscribeImmediately) {
          callback?.('SUBSCRIBED')
        }
        return mockChannel
      }),
    }

    // Handle user: if explicitly set to null, use null; otherwise default to mock user
    const userValue = 'user' in options ? options.user : { id: mockUserId }

    const instance = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: userValue },
          error: options.authError ?? null,
        }),
      },
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn().mockReturnValue(Promise.resolve()),
    }

    // Set the mock to always return this instance
    vi.mocked(createClient).mockReturnValue(instance as never)
    return instance
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up a default mock that won't crash on cleanup
    setupMockSupabase()
  })

  it('creates subscription on mount', async () => {
    const mockSupabase = setupMockSupabase()

    const { result } = renderHook(() => useDocumentStatus())

    // Wait for the async setup to complete
    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    expect(mockSupabase.channel).toHaveBeenCalledWith('document-status-changes')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${mockUserId}`,
      }),
      expect.any(Function)
    )
    expect(result.current.error).toBeNull()
  })

  it('calls onStatusChange when status changes', async () => {
    setupMockSupabase()
    const onStatusChange = vi.fn()

    const { result } = renderHook(() => useDocumentStatus({ onStatusChange }))

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    // Simulate a status change payload
    const payload: RealtimePostgresChangesPayload<DocumentRow> = {
      eventType: 'UPDATE',
      schema: 'public',
      table: 'documents',
      commit_timestamp: '2025-01-01T00:00:00Z',
      errors: null,
      old: {
        id: 'doc-123',
        processing_status: 'processing',
      } as Partial<DocumentRow>,
      new: {
        id: 'doc-123',
        user_id: mockUserId,
        filename: 'test.pdf',
        file_type: 'pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
        storage_path: '/docs/test.pdf',
        processing_status: 'completed',
        csv_type: null,
        extracted_data: null,
        row_count: null,
        column_mappings: null,
        error_message: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:01Z',
        processed_at: '2025-01-01T00:00:01Z',
      } as DocumentRow,
    }

    act(() => {
      postgresChangesCallback?.(payload)
    })

    expect(onStatusChange).toHaveBeenCalledWith({
      documentId: 'doc-123',
      oldStatus: 'processing',
      newStatus: 'completed',
      document: expect.objectContaining({
        id: 'doc-123',
        filename: 'test.pdf',
        processingStatus: 'completed',
      }),
    })
  })

  it('does not call onStatusChange if status did not change', async () => {
    setupMockSupabase()
    const onStatusChange = vi.fn()

    const { result } = renderHook(() => useDocumentStatus({ onStatusChange }))

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    // Simulate an update where status stayed the same
    const payload: RealtimePostgresChangesPayload<DocumentRow> = {
      eventType: 'UPDATE',
      schema: 'public',
      table: 'documents',
      commit_timestamp: '2025-01-01T00:00:00Z',
      errors: null,
      old: {
        id: 'doc-123',
        processing_status: 'processing',
      } as Partial<DocumentRow>,
      new: {
        id: 'doc-123',
        user_id: mockUserId,
        filename: 'test.pdf',
        file_type: 'pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
        storage_path: '/docs/test.pdf',
        processing_status: 'processing', // Same status
        csv_type: null,
        extracted_data: null,
        row_count: null,
        column_mappings: null,
        error_message: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:01Z',
        processed_at: null,
      } as DocumentRow,
    }

    act(() => {
      postgresChangesCallback?.(payload)
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('cleans up channel on unmount', async () => {
    const mockSupabase = setupMockSupabase()

    const { result, unmount } = renderHook(() => useDocumentStatus())

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    unmount()

    // Give cleanup time to run
    await waitFor(() => {
      expect(mockSupabase.removeChannel).toHaveBeenCalled()
    })
  })

  it('handles subscription errors', async () => {
    // Don't subscribe immediately so we can test error handling
    setupMockSupabase({ subscribeImmediately: false })
    const onError = vi.fn()

    const { result } = renderHook(() => useDocumentStatus({ onError }))

    // Wait for setup to start (channel created)
    await waitFor(() => {
      expect(subscribeCallback).not.toBeNull()
    })

    // Simulate subscription error
    act(() => {
      subscribeCallback?.('CHANNEL_ERROR', new Error('Connection failed'))
    })

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(false)
    })

    expect(result.current.error).toBe('Failed to subscribe to document changes')
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('sets error when user is not authenticated', async () => {
    // User is null - should fail authentication
    // Clean up any previous tests
    cleanup()
    vi.clearAllMocks()

    // Setup mock that returns no user
    const mockSupabase = setupMockSupabase({ user: null })

    const { result } = renderHook(() => useDocumentStatus())

    // Wait for the async getUser call to complete
    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    // Should set error since user is null
    await waitFor(() => {
      expect(result.current.error).toBe('Not authenticated')
    }, { timeout: 2000 })

    expect(result.current.isSubscribed).toBe(false)
    // Should not have tried to create a channel since user is null
    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('respects enabled option', async () => {
    const mockSupabase = setupMockSupabase()

    const { result } = renderHook(() => useDocumentStatus({ enabled: false }))

    // Give time for any async operations to settle (there shouldn't be any)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(result.current.isSubscribed).toBe(false)
    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('ignores INSERT events', async () => {
    setupMockSupabase()
    const onStatusChange = vi.fn()

    const { result } = renderHook(() => useDocumentStatus({ onStatusChange }))

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    // Simulate an INSERT event (should be ignored)
    const payload = {
      eventType: 'INSERT',
      schema: 'public',
      table: 'documents',
      commit_timestamp: '2025-01-01T00:00:00Z',
      errors: null,
      old: {},
      new: {
        id: 'doc-123',
        processing_status: 'pending',
      },
    } as RealtimePostgresChangesPayload<DocumentRow>

    act(() => {
      postgresChangesCallback?.(payload)
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })
})
