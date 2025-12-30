import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ChatClient } from './ChatClient'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Define mock functions at module level for hoisting
const mockToastError = vi.fn()
const mockSendMessage = vi.fn()
let mockOnError: ((error: Error) => void) | undefined
let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = []
let mockStatus: 'ready' | 'submitted' | 'streaming' = 'ready'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: (msg: string) => mockToastError(msg)
  }
}))

// Mock useChat hook with mutable state
vi.mock('@ai-sdk/react', () => ({
  useChat: (options?: { onError?: (error: Error) => void }) => {
    mockOnError = options?.onError
    return {
      messages: mockMessages,
      status: mockStatus,
      error: null,
      sendMessage: mockSendMessage
    }
  }
}))

describe('ChatClient Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnError = undefined
    mockMessages = []
    mockStatus = 'ready'
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
      const userMessage = container.querySelector('.justify-end')
      expect(userMessage).toBeInTheDocument()
    })

    it('renders assistant messages with correct variant', () => {
      mockMessages = [
        { id: '1', role: 'assistant', parts: [{ type: 'text', text: 'How can I help?' }] }
      ]

      const { container } = render(<ChatClient />)

      expect(screen.getByText('How can I help?')).toBeInTheDocument()
      const assistantMessage = container.querySelector('.justify-start')
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

  describe('Error Handling', () => {
    it('shows generic toast on network error', () => {
      render(<ChatClient />)

      // Simulate error by calling the onError callback
      expect(mockOnError).toBeDefined()
      mockOnError?.(new Error('Network error'))

      expect(mockToastError).toHaveBeenCalledWith('Failed to send message. Please try again.')
    })

    it('shows rate limit toast on 429 error', () => {
      render(<ChatClient />)

      mockOnError?.(new Error('Rate limit exceeded - 429'))

      expect(mockToastError).toHaveBeenCalledWith('Too many requests. Please wait a moment and try again.')
    })

    it('shows session expired toast on 401 error', () => {
      render(<ChatClient />)

      mockOnError?.(new Error('Unauthorized - 401'))

      expect(mockToastError).toHaveBeenCalledWith('Session expired. Please refresh the page.')
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
})
