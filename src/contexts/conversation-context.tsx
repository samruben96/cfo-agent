'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ConversationContextValue {
  conversationId: string | undefined
  setConversationId: (id: string | undefined) => void
  startNewConversation: () => void
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

interface ConversationProviderProps {
  initialConversationId?: string
  children: ReactNode
}

export function ConversationProvider({
  initialConversationId,
  children
}: ConversationProviderProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)

  const startNewConversation = useCallback(() => {
    setConversationId(undefined)
  }, [])

  return (
    <ConversationContext.Provider
      value={{
        conversationId,
        setConversationId,
        startNewConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversationContext(): ConversationContextValue {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversationContext must be used within a ConversationProvider')
  }
  return context
}
