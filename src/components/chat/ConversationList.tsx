'use client'

import { cn } from '@/lib/utils'
import { getDateGroup } from '@/lib/utils/format-date'
import { ConversationListItem } from './ConversationListItem'

import type { Conversation } from '@/lib/conversations/types'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (conversationId: string) => void
  className?: string
}

/**
 * Group conversations by date (Today, Yesterday, This Week, Older)
 */
function groupConversationsByDate(
  conversations: Conversation[]
): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {}

  for (const conv of conversations) {
    const group = getDateGroup(conv.updated_at)
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(conv)
  }

  // Return in a fixed order
  const orderedGroups: Record<string, Conversation[]> = {}
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']

  for (const groupName of groupOrder) {
    if (groups[groupName] && groups[groupName].length > 0) {
      orderedGroups[groupName] = groups[groupName]
    }
  }

  return orderedGroups
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  className
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground p-4', className)}>
        No past conversations
      </div>
    )
  }

  const grouped = groupConversationsByDate(conversations)

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(grouped).map(([group, convos]) => (
        <div key={group}>
          <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
            {group}
          </h3>
          <div className="space-y-1">
            {convos.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onClick={() => onSelect(conv.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
