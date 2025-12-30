/**
 * Conversation and message types for chat history persistence
 */

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[]
}
