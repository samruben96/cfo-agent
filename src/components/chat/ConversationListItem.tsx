'use client'

import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils/format-date'

import type { Conversation } from '@/lib/conversations/types'

interface ConversationListItemProps {
  conversation: Conversation
  isSelected?: boolean
  onClick: () => void
  className?: string
}

/**
 * Truncate text to maxLength characters with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function ConversationListItem({
  conversation,
  isSelected = false,
  onClick,
  className
}: ConversationListItemProps) {
  // Generate preview from title or fallback
  const preview = conversation.title || 'New conversation'
  const truncatedPreview = truncateText(preview, 50)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open conversation: ${preview}`}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted',
        className
      )}
    >
      <div className="font-medium text-sm truncate">{truncatedPreview}</div>
      <div className="text-xs text-muted-foreground">
        {formatRelativeDate(conversation.updated_at)}
      </div>
    </button>
  )
}
