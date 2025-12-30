-- Migration: 00005_create_conversations
-- Description: Create conversations and chat_messages tables for conversation history persistence
-- Story: 2-8-conversation-history-persistence

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies (separate policies per operation per project standards)
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================================
-- CHAT_MESSAGES TABLE
-- ============================================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies (users access messages through conversation ownership)
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

-- No update/delete policies for messages (immutable)

-- Indexes for performance
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
