'use client'

import { useState, useRef, FormEvent } from 'react'

import { useChat } from '@ai-sdk/react'
import { toast } from 'sonner'

import { ChatContainer, ChatMessage, ChatInput, TypingIndicator, EmptyState } from '@/components/chat'

interface ChatClientProps {
  className?: string
}

export function ChatClient({
  className
}: ChatClientProps) {
  // Note: agencyName, employeeCount, revenueRange props removed - profile data
  // is fetched server-side in /api/chat route for security (prevents client manipulation)

  const [input, setInput] = useState('')
  const lastInputRef = useRef('')

  const {
    messages,
    status,
    error,
    sendMessage
  } = useChat({
    onError: (err) => {
      // Differentiate error types for better user feedback
      const errorMessage = err?.message?.toLowerCase() || ''

      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Too many requests. Please wait a moment and try again.')
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        toast.error('Session expired. Please refresh the page.')
      } else {
        toast.error('Failed to send message. Please try again.')
      }

      console.error('[ChatClient]', { error: err?.message || 'Unknown error' })
      // Restore input on error
      setInput(lastInputRef.current)
    }
  })

  // Log error state changes (error is tracked but toast handles notification)
  void error

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      lastInputRef.current = input
      const messageText = input
      setInput('')
      sendMessage({ text: messageText })
    }
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <ChatContainer className="flex-1">
        {messages.length === 0 ? (
          <EmptyState onQuestionClick={handleQuestionClick} />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                variant={message.role === 'user' ? 'user' : 'assistant'}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
      </ChatContainer>
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  )
}
