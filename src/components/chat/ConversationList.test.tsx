import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ConversationList } from './ConversationList'

import type { Conversation } from '@/lib/conversations/types'

// Helper to create mock conversations
const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  user_id: 'user-1',
  title: 'Test conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('ConversationList', () => {
  const mockOnSelect = vi.fn()

  it('renders empty state when no conversations', () => {
    render(
      <ConversationList
        conversations={[]}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('No past conversations')).toBeInTheDocument()
  })

  it('renders list of conversations', () => {
    const conversations: Conversation[] = [
      createMockConversation({ id: 'conv-1', title: 'First conversation' }),
      createMockConversation({ id: 'conv-2', title: 'Second conversation' }),
    ]

    render(
      <ConversationList
        conversations={conversations}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('First conversation')).toBeInTheDocument()
    expect(screen.getByText('Second conversation')).toBeInTheDocument()
  })

  it('highlights selected conversation', () => {
    const conversations: Conversation[] = [
      createMockConversation({ id: 'conv-1', title: 'First conversation' }),
      createMockConversation({ id: 'conv-2', title: 'Second conversation' }),
    ]

    render(
      <ConversationList
        conversations={conversations}
        selectedId="conv-1"
        onSelect={mockOnSelect}
      />
    )

    // The selected item should have the selected styling
    const selectedItem = screen.getByText('First conversation').closest('button')
    expect(selectedItem).toHaveClass('bg-muted')
  })

  it('groups conversations by date', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const conversations: Conversation[] = [
      createMockConversation({
        id: 'conv-1',
        title: 'Today conversation',
        updated_at: today.toISOString(),
      }),
      createMockConversation({
        id: 'conv-2',
        title: 'Yesterday conversation',
        updated_at: yesterday.toISOString(),
      }),
    ]

    render(
      <ConversationList
        conversations={conversations}
        onSelect={mockOnSelect}
      />
    )

    // Should show date group headers (h3 elements)
    const headers = screen.getAllByRole('heading', { level: 3 })
    expect(headers).toHaveLength(2)
    expect(headers[0]).toHaveTextContent('Today')
    expect(headers[1]).toHaveTextContent('Yesterday')
  })

  it('accepts custom className', () => {
    render(
      <ConversationList
        conversations={[]}
        onSelect={mockOnSelect}
        className="custom-class"
      />
    )

    const container = screen.getByText('No past conversations').closest('div')
    expect(container).toHaveClass('custom-class')
  })
})
