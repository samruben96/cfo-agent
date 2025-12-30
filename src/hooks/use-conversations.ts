'use client'

import { useState, useEffect, useCallback } from 'react'

import { createClient } from '@/lib/supabase/client'

import type { Conversation } from '@/lib/conversations/types'

interface UseConversationsResult {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage the list of conversations for the current user
 */
export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setConversations([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (fetchError) {
        console.error('[useConversations]', { error: fetchError.message })
        setError('Failed to fetch conversations')
        return
      }

      setConversations(data ?? [])
    } catch (err) {
      console.error('[useConversations]', { error: err })
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  }
}
