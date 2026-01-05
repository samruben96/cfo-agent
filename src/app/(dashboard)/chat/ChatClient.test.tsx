import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ChatClient } from './ChatClient'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Define mock functions at module level for hoisting
const mockToastError = vi.fn()
const mockSendMessage = vi.fn()
const mockSetMessages = vi.fn()
let mockOnError: ((error: Error) => void) | undefined
let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = []
let mockStatus: 'ready' | 'submitted' | 'streaming' = 'ready'
let mockConversation: { messages: Array<{ id: string; conversation_id: string; role: string; content: string; created_at: string }> } | null = null
let mockIsLoadingHistory = false

// Mock sonner toast (accepts title and optional options with description)
vi.mock('sonner', () => ({
  toast: {
    error: (msg: string, options?: { description?: string }) => mockToastError(msg, options)
  }
}))

// Mock useConversation hook
vi.mock('@/hooks/use-conversation', () => ({
  useConversation: () => ({
    conversation: mockConversation,
    isLoading: mockIsLoadingHistory,
    error: null,
    refetch: vi.fn(),
  })
}))

// Mock useChat hook with mutable state
vi.mock('@ai-sdk/react', () => ({
  useChat: (options?: { onError?: (error: Error) => void }) => {
    mockOnError = options?.onError
    return {
      messages: mockMessages,
      status: mockStatus,
      error: null,
      sendMessage: mockSendMessage,
      setMessages: mockSetMessages,
    }
  }
}))

describe('ChatClient Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnError = undefined
    mockMessages = []
    mockStatus = 'ready'
    mockConversation = null
    mockIsLoadingHistory = false
  })

  describe('Empty State', () => {
    it('displays empty state when no messages exist', () => {
      render(<ChatClient />)

      expect(screen.getByText('Welcome to your CFO Bot')).toBeInTheDocument()
    })

    it('displays example questions', () => {
      render(<ChatClient />)

      expect(screen.getByText('What does each employee cost me?')).toBeInTheDocument()
      expect(screen.getByText('What is my payroll ratio?')).toBeInTheDocument()
      expect(screen.getByText('Can I afford to hire someone new?')).toBeInTheDocument()
    })

    it('pre-fills input when example question is clicked', async () => {
      const user = userEvent.setup()
      render(<ChatClient />)

      const questionButton = screen.getByText('What does each employee cost me?')
      await user.click(questionButton)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      expect(textarea).toHaveValue('What does each employee cost me?')
    })
  })

  describe('Message Rendering', () => {
    it('renders user messages with correct variant', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
      ]

      const { container } = render(<ChatClient />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      const userMessage = container.querySelector('.items-end')
      expect(userMessage).toBeInTheDocument()
    })

    it('renders assistant messages with correct variant', () => {
      mockMessages = [
        { id: '1', role: 'assistant', parts: [{ type: 'text', text: 'How can I help?' }] }
      ]

      const { container } = render(<ChatClient />)

      expect(screen.getByText('How can I help?')).toBeInTheDocument()
      const assistantMessage = container.querySelector('.items-start')
      expect(assistantMessage).toBeInTheDocument()
    })

    it('renders multiple messages in order', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'First message' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Second message' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'Third message' }] }
      ]

      render(<ChatClient />)

      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
      expect(screen.getByText('Third message')).toBeInTheDocument()
    })

    it('does not show empty state when messages exist', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
      ]

      render(<ChatClient />)

      expect(screen.queryByText('Welcome to your CFO Bot')).not.toBeInTheDocument()
    })
  })

  describe('Input Behavior', () => {
    it('renders chat input', () => {
      render(<ChatClient />)

      expect(screen.getByPlaceholderText('Ask your CFO anything...')).toBeInTheDocument()
    })

    it('allows typing in the input', async () => {
      const user = userEvent.setup()
      render(<ChatClient />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      await user.type(textarea, 'Test message')

      expect(textarea).toHaveValue('Test message')
    })

    it('calls sendMessage when form is submitted', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatClient />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      await user.type(textarea, 'Test question')

      const submitButton = container.querySelector('button[type="submit"]')!
      await user.click(submitButton)

      expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Test question' })
    })

    it('clears input after submit', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChatClient />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      await user.type(textarea, 'Test question')

      const submitButton = container.querySelector('button[type="submit"]')!
      await user.click(submitButton)

      expect(textarea).toHaveValue('')
    })

    it('disables input while loading', () => {
      mockStatus = 'streaming'

      render(<ChatClient />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      expect(textarea).toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('shows typing indicator when streaming', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
      ]
      mockStatus = 'streaming'

      const { container } = render(<ChatClient />)

      const animatedDots = container.querySelectorAll('.animate-bounce')
      expect(animatedDots.length).toBe(3)
    })

    it('shows typing indicator when submitted', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
      ]
      mockStatus = 'submitted'

      const { container } = render(<ChatClient />)

      const animatedDots = container.querySelectorAll('.animate-bounce')
      expect(animatedDots.length).toBe(3)
    })

    it('does not show typing indicator when ready', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
      ]
      mockStatus = 'ready'

      const { container } = render(<ChatClient />)

      const animatedDots = container.querySelectorAll('.animate-bounce')
      expect(animatedDots.length).toBe(0)
    })
  })

  describe('Suggested Questions', () => {
    it('parses suggestions from last assistant message', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'What is my payroll?' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Your payroll is $50,000 per month.

---SUGGESTIONS---
- How does this compare to benchmarks?
- Can I reduce payroll costs?`
          }]
        }
      ]
      mockStatus = 'ready'

      render(<ChatClient />)

      // Suggestions should be rendered for completed assistant messages
      expect(screen.getByText('How does this compare to benchmarks?')).toBeInTheDocument()
      expect(screen.getByText('Can I reduce payroll costs?')).toBeInTheDocument()
    })

    it('does not show suggestions while loading', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'What is my payroll?' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Your payroll is $50,000.

---SUGGESTIONS---
- How does this compare?`
          }]
        }
      ]
      mockStatus = 'streaming'

      render(<ChatClient />)

      // Suggestions should not appear during streaming
      expect(screen.queryByText('How does this compare?')).not.toBeInTheDocument()
    })

    it('calls sendMessage when suggestion is clicked', async () => {
      const user = userEvent.setup()
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Hi there!

---SUGGESTIONS---
- Tell me more`
          }]
        }
      ]
      mockStatus = 'ready'

      render(<ChatClient />)

      const suggestionButton = screen.getByText('Tell me more')
      await user.click(suggestionButton)

      expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Tell me more' })
    })

    it('does not send suggestion when loading', async () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Response

---SUGGESTIONS---
- Follow up`
          }]
        }
      ]
      // Start ready, then switch to streaming after render
      mockStatus = 'ready'

      const { rerender } = render(<ChatClient />)

      // Switch to loading state
      mockStatus = 'streaming'
      rerender(<ChatClient />)

      // Suggestion should not be visible during loading
      expect(screen.queryByText('Follow up')).not.toBeInTheDocument()
    })

    it('does not show suggestions when last message is from user', () => {
      mockMessages = [
        {
          id: '1',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Hello!

---SUGGESTIONS---
- Old suggestion`
          }]
        },
        { id: '2', role: 'user', parts: [{ type: 'text', text: 'New question' }] }
      ]
      mockStatus = 'ready'

      render(<ChatClient />)

      // Suggestions from previous assistant message should not be shown
      expect(screen.queryByText('Old suggestion')).not.toBeInTheDocument()
    })

    it('strips suggestions section from displayed message content', () => {
      mockMessages = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `This is the main response.

---SUGGESTIONS---
- Follow up question`
          }]
        }
      ]
      mockStatus = 'ready'

      render(<ChatClient />)

      // Main content should be visible
      expect(screen.getByText('This is the main response.')).toBeInTheDocument()
      // Delimiter should not be visible in the message
      expect(screen.queryByText('---SUGGESTIONS---')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows generic toast on network error', () => {
      render(<ChatClient />)

      // Simulate error by calling the onError callback
      expect(mockOnError).toBeDefined()
      mockOnError?.(new Error('Network error'))

      // Uses friendly error messages from getFriendlyError utility
      expect(mockToastError).toHaveBeenCalledWith(
        "We couldn't connect to our servers.",
        { description: 'Check your internet connection and try again.' }
      )
    })

    it('shows rate limit toast on 429 error', () => {
      render(<ChatClient />)

      mockOnError?.(new Error('Rate limit exceeded - 429'))

      // Uses friendly error messages from getFriendlyError utility
      expect(mockToastError).toHaveBeenCalledWith(
        "We're getting a lot of requests right now.",
        { description: 'Please wait a moment and try again.' }
      )
    })

    it('shows session expired toast on 401 error', () => {
      render(<ChatClient />)

      mockOnError?.(new Error('Unauthorized - 401'))

      // Uses friendly error messages from getFriendlyError utility
      expect(mockToastError).toHaveBeenCalledWith(
        'Your session has expired.',
        { description: 'Please refresh the page to sign in again.' }
      )
    })

    it('logs error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ChatClient />)

      mockOnError?.(new Error('API rate limit'))

      expect(consoleSpy).toHaveBeenCalledWith('[ChatClient]', { error: 'API rate limit' })

      consoleSpy.mockRestore()
    })

    it('restores input on error after submit', async () => {
      const user = userEvent.setup()

      render(<ChatClient />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      await user.type(textarea, 'My important question')

      // Get the submit button and submit
      const form = textarea.closest('form')!
      await user.click(form.querySelector('button[type="submit"]')!)

      // Input should be cleared after submit
      expect(textarea).toHaveValue('')

      // Simulate error callback which should restore input
      // Use act() to handle the React state update properly
      await act(async () => {
        mockOnError?.(new Error('Network error'))
      })

      // The input should be restored from the ref
      expect(textarea).toHaveValue('My important question')
    })
  })

  describe('Conversation Persistence', () => {
    it('shows loading state while fetching conversation history', () => {
      mockIsLoadingHistory = true

      render(<ChatClient initialConversationId="conv-123" />)

      expect(screen.getByText('Loading conversation...')).toBeInTheDocument()
    })

    it('does not show loading state without conversationId', () => {
      mockIsLoadingHistory = true

      render(<ChatClient />)

      // Should show empty state instead of loading
      expect(screen.queryByText('Loading conversation...')).not.toBeInTheDocument()
      expect(screen.getByText('Welcome to your CFO Bot')).toBeInTheDocument()
    })

    it('disables input while loading history', () => {
      mockIsLoadingHistory = true

      render(<ChatClient initialConversationId="conv-123" />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      expect(textarea).toBeDisabled()
    })

    it('accepts onConversationChange callback prop', () => {
      const onConversationChange = vi.fn()

      // Simply verify the component renders with the callback prop
      render(<ChatClient onConversationChange={onConversationChange} />)

      // The callback will be called when the server returns a new conversation ID
      // This is handled internally via the transport body pattern
      expect(screen.getByText('Welcome to your CFO Bot')).toBeInTheDocument()
    })
  })
})
