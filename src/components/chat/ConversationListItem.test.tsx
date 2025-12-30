import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { ConversationListItem } from './ConversationListItem'

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

describe('ConversationListItem', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('renders conversation title', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation({ title: 'My conversation' })}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('My conversation')).toBeInTheDocument()
  })

  it('renders fallback title when title is null', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation({ title: null })}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('New conversation')).toBeInTheDocument()
  })

  it('truncates long titles to 50 characters', () => {
    const longTitle = 'This is a very long conversation title that should be truncated'
    render(
      <ConversationListItem
        conversation={createMockConversation({ title: longTitle })}
        onClick={mockOnClick}
      />
    )

    // Should show truncated title with ellipsis
    expect(screen.getByText('This is a very long conversation title that should...')).toBeInTheDocument()
  })

  it('displays relative date', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation()}
        onClick={mockOnClick}
      />
    )

    // Should display some form of relative date (exact format varies)
    const dateElement = screen.getByText(/ago|Yesterday|Today/i, { exact: false })
    expect(dateElement).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation()}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('applies selected styling when isSelected is true', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation()}
        isSelected={true}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-muted')
  })

  it('does not apply selected styling when isSelected is false', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation()}
        isSelected={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).not.toHaveClass('bg-muted')
  })

  it('accepts custom className', () => {
    render(
      <ConversationListItem
        conversation={createMockConversation()}
        onClick={mockOnClick}
        className="custom-class"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
