'use client'

import { useState, useEffect, useCallback } from 'react'

import { createClient } from '@/lib/supabase/client'

import type { ChatMessage, ConversationWithMessages } from '@/lib/conversations/types'

interface UseConversationResult {
  conversation: ConversationWithMessages | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch a single conversation with its messages
 */
export function useConversation(conversationId: string | undefined): UseConversationResult {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError || !conv) {
        console.error('[useConversation]', { error: convError?.message })
        setError('Conversation not found')
        return
      }

      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('[useConversation]', { error: msgError.message })
        setError('Failed to fetch messages')
        return
      }

      setConversation({
        ...conv,
        messages: (messages ?? []) as ChatMessage[],
      })
    } catch (err) {
      console.error('[useConversation]', { error: err })
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchConversation()
  }, [fetchConversation])

  return {
    conversation,
    isLoading,
    error,
    refetch: fetchConversation,
  }
}
