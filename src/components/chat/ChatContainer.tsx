'use client'

import { useRef, useEffect, useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  children: React.ReactNode
  className?: string
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUserScrolled(false)
  }

  useEffect(() => {
    if (!userScrolled) {
      scrollToBottom()
    }
  }, [children, userScrolled])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
    if (!isNearBottom) {
      setUserScrolled(true)
    }
  }

  return (
    <div className={cn('relative flex flex-col min-h-0', className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-md pt-xl pb-lg bg-surface"
        data-testid="chat-messages-container"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="max-w-chat mx-auto space-y-lg">
          {children}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
