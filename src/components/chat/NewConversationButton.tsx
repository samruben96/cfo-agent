'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NewConversationButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function NewConversationButton({
  onClick,
  disabled = false,
  className
}: NewConversationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn('gap-1', className)}
      aria-label="Start new conversation"
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  )
}
