import { createClient } from '@/lib/supabase/server'

import type { ChatMessage, Conversation, ConversationWithMessages } from './types'

/**
 * Create a new conversation for a user
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title: title ?? null })
    .select()
    .single()

  if (error) {
    console.error('[ConversationService]', { action: 'createConversation', error: error.message })
    return { data: null, error: 'Failed to create conversation' }
  }

  return { data, error: null }
}

/**
 * Get all conversations for a user, ordered by most recent first
 */
export async function getConversations(
  userId: string
): Promise<{ data: Conversation[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[ConversationService]', { action: 'getConversations', error: error.message })
    return { data: null, error: 'Failed to fetch conversations' }
  }

  return { data, error: null }
}

/**
 * Get a single conversation with all its messages
 */
export async function getConversation(
  conversationId: string
): Promise<{ data: ConversationWithMessages | null; error: string | null }> {
  const supabase = await createClient()

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    console.error('[ConversationService]', { action: 'getConversation', error: convError?.message })
    return { data: null, error: 'Conversation not found' }
  }

  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('[ConversationService]', { action: 'getConversationMessages', error: msgError.message })
    return { data: null, error: 'Failed to fetch messages' }
  }

  return {
    data: {
      ...conversation,
      messages: (messages ?? []) as ChatMessage[]
    },
    error: null
  }
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<{ data: ChatMessage | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single()

  if (error) {
    console.error('[ConversationService]', { action: 'saveMessage', error: error.message })
    return { data: null, error: 'Failed to save message' }
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return { data: data as ChatMessage, error: null }
}

/**
 * Update a conversation's title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) {
    console.error('[ConversationService]', { action: 'updateConversationTitle', error: error.message })
    return { data: null, error: 'Failed to update conversation title' }
  }

  return { data, error: null }
}

/**
 * Get the most recent conversation for a user
 */
export async function getMostRecentConversation(
  userId: string
): Promise<{ data: ConversationWithMessages | null; error: string | null }> {
  const supabase = await createClient()

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (convError || !conversation) {
    // No conversation exists yet - not an error condition
    if (convError?.code === 'PGRST116') {
      return { data: null, error: null }
    }
    console.error('[ConversationService]', { action: 'getMostRecentConversation', error: convError?.message })
    return { data: null, error: 'Failed to fetch recent conversation' }
  }

  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('[ConversationService]', { action: 'getMostRecentConversationMessages', error: msgError.message })
    return { data: null, error: 'Failed to fetch messages' }
  }

  return {
    data: {
      ...conversation,
      messages: (messages ?? []) as ChatMessage[]
    },
    error: null
  }
}
