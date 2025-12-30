'use client'

import { cn } from '@/lib/utils'

import type { UIMessage } from 'ai'

function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function formatMarkdown(text: string): React.ReactNode {
  // Simple markdown rendering for common patterns
  // Bold: **text** or __text__
  // Italic: *text* or _text_
  // Code: `code`
  // Lists: - item or * item

  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    // Handle list items
    const listMatch = line.match(/^[\s]*[-*]\s+(.*)$/)
    if (listMatch) {
      return (
        <div key={lineIndex} className="flex gap-2">
          <span className="text-muted-foreground">•</span>
          <span>{formatInlineMarkdown(listMatch[1])}</span>
        </div>
      )
    }

    // Regular line with inline formatting
    return (
      <span key={lineIndex}>
        {formatInlineMarkdown(line)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

function formatInlineMarkdown(text: string): React.ReactNode {
  // Split by markdown patterns and render
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code key={key++} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Italic: *text* (single asterisk, not followed by another)
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Find next special character or end
    const nextSpecial = remaining.search(/[*`]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      // Special char that didn't match a pattern, treat as literal
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

interface ChatMessageProps {
  message: UIMessage
  variant?: 'user' | 'assistant'
  className?: string
  timestamp?: Date
}

function getMessageTimestamp(timestamp?: Date): string {
  // UIMessage from AI SDK v6 doesn't include createdAt
  // Timestamp can be passed as a prop or defaults to now
  return (timestamp ?? new Date()).toLocaleTimeString()
}

export function ChatMessage({
  message,
  variant = 'assistant',
  className,
  timestamp
}: ChatMessageProps) {
  const isUser = variant === 'user'
  const content = getMessageContent(message)

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-md py-sm',
          isUser
            ? 'bg-accent text-accent-foreground'
            : 'bg-white border border-border shadow-sm'
        )}
      >
        <div className="prose prose-sm max-w-none">
          {formatMarkdown(content)}
        </div>
        <time className="text-xs text-muted-foreground mt-xs block opacity-0 hover:opacity-100 transition-opacity">
          {getMessageTimestamp(timestamp)}
        </time>
      </div>
    </div>
  )
}
