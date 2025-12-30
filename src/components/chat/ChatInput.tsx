'use client'

import { FormEvent, KeyboardEvent } from 'react'

import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  className
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form && value.trim()) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className={cn('border-t bg-background p-md', className)}>
      <form onSubmit={onSubmit} className="max-w-chat mx-auto">
        <div className="flex gap-sm items-end">
          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask your CFO anything..."
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            size="icon"
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
