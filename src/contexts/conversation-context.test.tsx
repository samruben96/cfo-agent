import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ConversationProvider, useConversationContext } from './conversation-context'

// Helper component to test the context
function TestConsumer() {
  const { conversationId, setConversationId, startNewConversation } = useConversationContext()

  return (
    <div>
      <span data-testid="conversation-id">{conversationId ?? 'none'}</span>
      <button onClick={() => setConversationId('new-conv-123')}>
        Set Conversation
      </button>
      <button onClick={startNewConversation}>Start New</button>
    </div>
  )
}

describe('ConversationContext', () => {
  it('provides initial conversation ID', () => {
    render(
      <ConversationProvider initialConversationId="initial-conv">
        <TestConsumer />
      </ConversationProvider>
    )

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('initial-conv')
  })

  it('provides undefined when no initial ID', () => {
    render(
      <ConversationProvider>
        <TestConsumer />
      </ConversationProvider>
    )

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('none')
  })

  it('allows setting conversation ID', async () => {
    const user = userEvent.setup()

    render(
      <ConversationProvider>
        <TestConsumer />
      </ConversationProvider>
    )

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('none')

    await user.click(screen.getByText('Set Conversation'))

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('new-conv-123')
  })

  it('resets conversation ID on startNewConversation', async () => {
    const user = userEvent.setup()

    render(
      <ConversationProvider initialConversationId="existing-conv">
        <TestConsumer />
      </ConversationProvider>
    )

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('existing-conv')

    await user.click(screen.getByText('Start New'))

    expect(screen.getByTestId('conversation-id')).toHaveTextContent('none')
  })

  it('throws error when used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useConversationContext must be used within a ConversationProvider')

    consoleSpy.mockRestore()
  })
})
