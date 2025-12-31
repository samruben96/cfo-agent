'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

import { createClient } from '@/lib/supabase/client'
import { transformRowToDocument } from '@/types/documents'

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Document, DocumentRow, ProcessingStatus } from '@/types/documents'

/**
 * Represents a document status change event from Supabase Realtime.
 */
export interface DocumentStatusChange {
  documentId: string
  oldStatus: ProcessingStatus
  newStatus: ProcessingStatus
  document: Document
}

/**
 * Options for the useDocumentStatus hook.
 */
export interface UseDocumentStatusOptions {
  /** Called when a document's processing_status changes */
  onStatusChange?: (change: DocumentStatusChange) => void
  /** Called when a subscription error occurs */
  onError?: (error: Error) => void
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean
}

/**
 * Return value from the useDocumentStatus hook.
 */
export interface UseDocumentStatusResult {
  /** Whether the realtime channel is successfully subscribed */
  isSubscribed: boolean
  /** Any subscription error that occurred */
  error: string | null
}

/**
 * Hook to subscribe to realtime document status changes.
 * Uses Supabase Realtime to listen for UPDATE events on the documents table,
 * filtered by the current user's ID for security.
 *
 * @example
 * ```tsx
 * const { isSubscribed } = useDocumentStatus({
 *   onStatusChange: (change) => {
 *     toast.success(`Document ${change.document.filename} is now ${change.newStatus}`)
 *   },
 *   onError: (error) => console.error(error),
 * })
 * ```
 */
export function useDocumentStatus(
  options: UseDocumentStatusOptions = {}
): UseDocumentStatusResult {
  const { onStatusChange, onError, enabled = true } = options

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Store callbacks in refs to avoid re-subscribing when they change
  const onStatusChangeRef = useRef(onStatusChange)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
    onErrorRef.current = onError
  }, [onStatusChange, onError])

  // Handle payload from Supabase Realtime
  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<DocumentRow>) => {
      if (payload.eventType !== 'UPDATE') return

      const oldRecord = payload.old as Partial<DocumentRow>
      const newRecord = payload.new as DocumentRow

      // Only trigger callback if processing_status actually changed
      if (oldRecord.processing_status !== newRecord.processing_status) {
        const change: DocumentStatusChange = {
          documentId: newRecord.id,
          oldStatus: oldRecord.processing_status as ProcessingStatus,
          newStatus: newRecord.processing_status as ProcessingStatus,
          document: transformRowToDocument(newRecord),
        }

        console.log('[useDocumentStatus]', {
          action: 'statusChange',
          documentId: change.documentId,
          oldStatus: change.oldStatus,
          newStatus: change.newStatus,
        })

        onStatusChangeRef.current?.(change)
      }
    },
    []
  )

  useEffect(() => {
    if (!enabled) {
      setIsSubscribed(false)
      return
    }

    const supabase = createClient()
    let mounted = true

    const setupSubscription = async () => {
      try {
        // Get current user for filtering
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log('[useDocumentStatus]', { action: 'noUser', authError })
          if (mounted) {
            setError('Not authenticated')
            setIsSubscribed(false)
          }
          return
        }

        // Clean up any existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current)
        }

        // Create realtime channel with postgres_changes subscription
        const channel = supabase
          .channel('document-status-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'documents',
              filter: `user_id=eq.${user.id}`,
            },
            handlePayload
          )
          .subscribe((status, err) => {
            if (!mounted) return

            if (status === 'SUBSCRIBED') {
              console.log('[useDocumentStatus]', { action: 'subscribed' })
              setIsSubscribed(true)
              setError(null)
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('[useDocumentStatus]', { action: 'error', status, err })
              const errorMsg = 'Failed to subscribe to document changes'
              setError(errorMsg)
              setIsSubscribed(false)
              onErrorRef.current?.(new Error(errorMsg))
            } else if (status === 'CLOSED') {
              console.log('[useDocumentStatus]', { action: 'closed' })
              setIsSubscribed(false)
            }
          })

        channelRef.current = channel
      } catch (err) {
        console.error('[useDocumentStatus]', { action: 'setupError', err })
        if (mounted) {
          const errorMsg = 'Failed to setup document status subscription'
          setError(errorMsg)
          onErrorRef.current?.(new Error(errorMsg))
        }
      }
    }

    setupSubscription()

    // Cleanup on unmount - reuse the same supabase client
    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch((err) => {
          console.error('[useDocumentStatus]', { action: 'cleanupError', err })
        })
        channelRef.current = null
      }
    }
  }, [enabled, handlePayload])

  return { isSubscribed, error }
}
