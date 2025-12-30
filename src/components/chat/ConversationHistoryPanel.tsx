'use client'

import { useState, useMemo, useEffect } from 'react'

import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useConversations } from '@/hooks/use-conversations'
import { ConversationList } from './ConversationList'

interface ConversationHistoryPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  className?: string
}

export function ConversationHistoryPanel({
  open,
  onOpenChange,
  selectedConversationId,
  onSelectConversation,
  className,
}: ConversationHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const { conversations, isLoading, error } = useConversations()

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter conversations by debounced search query (case-insensitive)
  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    if (!debouncedSearchQuery.trim()) return conversations

    const query = debouncedSearchQuery.toLowerCase()
    return conversations.filter(conv => {
      const title = conv.title?.toLowerCase() ?? ''
      return title.includes(query)
    })
  }, [conversations, debouncedSearchQuery])

  const handleSelect = (conversationId: string) => {
    onSelectConversation(conversationId)
    onOpenChange(false) // Close panel after selection
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn('w-[280px] sm:w-[350px]', className)}>
        <SheetHeader>
          <SheetTitle>Conversation History</SheetTitle>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative mt-4 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-4">Loading...</div>
          ) : error ? (
            <div className="text-sm text-destructive p-4">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">
              {searchQuery ? 'No conversations match your search' : 'No past conversations'}
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversationId}
              onSelect={handleSelect}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
