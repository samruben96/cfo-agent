import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import { ConversationHistoryPanel } from './ConversationHistoryPanel'
import { useConversations } from '@/hooks/use-conversations'

import type { Conversation } from '@/lib/conversations/types'

// Mock useConversations hook
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn(),
}))

const mockUseConversations = vi.mocked(useConversations)

// Helper to create mock conversations
const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  user_id: 'user-1',
  title: 'Test conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('ConversationHistoryPanel', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSelectConversation = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnOpenChange.mockClear()
    mockOnSelectConversation.mockClear()

    // Reset mock to default
    mockUseConversations.mockReturnValue({
      conversations: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders sheet when open', () => {
    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByText('Conversation History')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <ConversationHistoryPanel
        open={false}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.queryByText('Conversation History')).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      isLoading: false,
      error: 'Failed to fetch',
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })

  it('shows empty state when no conversations', () => {
    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByText('No past conversations')).toBeInTheDocument()
  })

  it('renders list of conversations', () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        createMockConversation({ id: 'conv-1', title: 'First conversation' }),
        createMockConversation({ id: 'conv-2', title: 'Second conversation' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByText('First conversation')).toBeInTheDocument()
    expect(screen.getByText('Second conversation')).toBeInTheDocument()
  })

  it('calls onSelectConversation when conversation is clicked', async () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        createMockConversation({ id: 'conv-1', title: 'Test conversation' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    const button = screen.getByText('Test conversation').closest('button')
    fireEvent.click(button!)

    expect(mockOnSelectConversation).toHaveBeenCalledWith('conv-1')
    expect(mockOnOpenChange).toHaveBeenCalledWith(false) // Closes panel after selection
  })

  it('has search input', () => {
    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument()
  })

  it('filters conversations by search query', async () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        createMockConversation({ id: 'conv-1', title: 'Budget meeting' }),
        createMockConversation({ id: 'conv-2', title: 'Financial analysis' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search conversations...')

    // Use fireEvent instead of userEvent for fake timers compatibility
    fireEvent.change(searchInput, { target: { value: 'budget' } })

    // Advance timers to trigger the debounce (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should show matching conversation
    expect(screen.getByText('Budget meeting')).toBeInTheDocument()
    // Should not show non-matching conversation
    expect(screen.queryByText('Financial analysis')).not.toBeInTheDocument()
  })

  it('shows no results message when search has no matches', () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        createMockConversation({ id: 'conv-1', title: 'Test conversation' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelectConversation={mockOnSelectConversation}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search conversations...')

    // Use fireEvent instead of userEvent for fake timers compatibility
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Advance timers to trigger the debounce (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText('No conversations match your search')).toBeInTheDocument()
  })

  it('highlights selected conversation', () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        createMockConversation({ id: 'conv-1', title: 'First conversation' }),
        createMockConversation({ id: 'conv-2', title: 'Second conversation' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <ConversationHistoryPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        selectedConversationId="conv-1"
        onSelectConversation={mockOnSelectConversation}
      />
    )

    const selectedItem = screen.getByText('First conversation').closest('button')
    expect(selectedItem).toHaveClass('bg-muted')
  })
})
