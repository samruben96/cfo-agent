import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ChatContainer } from './ChatContainer'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children content', () => {
    render(
      <ChatContainer>
        <div>Test message</div>
      </ChatContainer>
    )

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders with centered layout and max-width', () => {
    const { container } = render(
      <ChatContainer>
        <div>Test</div>
      </ChatContainer>
    )

    const innerContainer = container.querySelector('.max-w-chat')
    expect(innerContainer).toBeInTheDocument()
    expect(innerContainer).toHaveClass('mx-auto')
  })

  it('has scrollable message area with accessibility attributes', () => {
    render(
      <ChatContainer>
        <div>Test</div>
      </ChatContainer>
    )

    const scrollableArea = screen.getByTestId('chat-messages-container')
    expect(scrollableArea).toHaveClass('overflow-y-auto')
    expect(scrollableArea).toHaveAttribute('role', 'log')
    expect(scrollableArea).toHaveAttribute('aria-live', 'polite')
    expect(scrollableArea).toHaveAttribute('aria-label', 'Chat messages')
  })

  it('does not show scroll button initially when at bottom', () => {
    render(
      <ChatContainer>
        <div>Test</div>
      </ChatContainer>
    )

    const scrollButton = screen.queryByRole('button', { name: 'Scroll to bottom' })
    expect(scrollButton).not.toBeInTheDocument()
  })

  it('shows scroll button when scrolled up', () => {
    render(
      <ChatContainer>
        <div style={{ height: '2000px' }}>Long content</div>
      </ChatContainer>
    )

    const scrollableArea = screen.getByTestId('chat-messages-container')

    // Mock the scroll state
    Object.defineProperty(scrollableArea, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(scrollableArea, 'scrollHeight', { value: 2000, writable: true })
    Object.defineProperty(scrollableArea, 'clientHeight', { value: 500, writable: true })

    fireEvent.scroll(scrollableArea)

    const scrollButton = screen.getByRole('button', { name: 'Scroll to bottom' })
    expect(scrollButton).toBeInTheDocument()
  })

  it('scrolls to bottom when scroll button is clicked', () => {
    render(
      <ChatContainer>
        <div style={{ height: '2000px' }}>Long content</div>
      </ChatContainer>
    )

    const scrollableArea = screen.getByTestId('chat-messages-container')

    // Mock being scrolled up
    Object.defineProperty(scrollableArea, 'scrollTop', { value: 0, writable: true })
    Object.defineProperty(scrollableArea, 'scrollHeight', { value: 2000, writable: true })
    Object.defineProperty(scrollableArea, 'clientHeight', { value: 500, writable: true })

    fireEvent.scroll(scrollableArea)

    const scrollButton = screen.getByRole('button', { name: 'Scroll to bottom' })
    fireEvent.click(scrollButton)

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('accepts and applies custom className', () => {
    const { container } = render(
      <ChatContainer className="custom-class">
        <div>Test</div>
      </ChatContainer>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('maintains full height layout', () => {
    const { container } = render(
      <ChatContainer>
        <div>Test</div>
      </ChatContainer>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('h-full')
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('flex-col')
  })
})
