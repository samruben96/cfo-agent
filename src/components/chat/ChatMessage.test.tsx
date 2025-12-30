import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { ChatMessage } from './ChatMessage'

import type { UIMessage } from 'ai'

const createMockMessage = (role: 'user' | 'assistant', text: string): UIMessage => ({
  id: '1',
  role,
  parts: [{ type: 'text', text }]
})

const mockUserMessage = createMockMessage('user', 'Hello, how are you?')
const mockAssistantMessage = createMockMessage('assistant', 'I am doing well, thank you!')

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(<ChatMessage message={mockUserMessage} variant="user" />)

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
  })

  it('renders assistant message content', () => {
    render(<ChatMessage message={mockAssistantMessage} variant="assistant" />)

    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument()
  })

  it('applies user variant styles with right alignment', () => {
    const { container } = render(<ChatMessage message={mockUserMessage} variant="user" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('justify-end')
  })

  it('applies assistant variant styles with left alignment', () => {
    const { container } = render(<ChatMessage message={mockAssistantMessage} variant="assistant" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('justify-start')
  })

  it('defaults to assistant variant', () => {
    const { container } = render(<ChatMessage message={mockAssistantMessage} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('justify-start')
  })

  it('displays timestamp in time element', () => {
    render(<ChatMessage message={mockUserMessage} variant="user" />)

    const timeElement = screen.getByRole('time')
    expect(timeElement).toBeInTheDocument()
  })

  it('accepts and applies custom className', () => {
    const { container } = render(
      <ChatMessage message={mockUserMessage} variant="user" className="custom-class" />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('renders user message with accent background', () => {
    const { container } = render(<ChatMessage message={mockUserMessage} variant="user" />)

    const messageBubble = container.querySelector('.bg-accent')
    expect(messageBubble).toBeInTheDocument()
  })

  it('renders assistant message with white background', () => {
    const { container } = render(<ChatMessage message={mockAssistantMessage} variant="assistant" />)

    const messageBubble = container.querySelector('.bg-white')
    expect(messageBubble).toBeInTheDocument()
  })

  it('handles message with multiple text parts', () => {
    const multiPartMessage: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'World!' }
      ]
    }

    render(<ChatMessage message={multiPartMessage} variant="assistant" />)

    expect(screen.getByText('Hello World!')).toBeInTheDocument()
  })

  it('handles empty parts array', () => {
    const emptyMessage: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: []
    }

    const { container } = render(<ChatMessage message={emptyMessage} variant="assistant" />)

    const proseDiv = container.querySelector('.prose')
    expect(proseDiv).toBeInTheDocument()
  })

  it('displays provided timestamp when passed as prop', () => {
    const timestamp = new Date('2025-12-29T12:30:00')
    const message = createMockMessage('user', 'Hello')

    render(<ChatMessage message={message} variant="user" timestamp={timestamp} />)

    const timeElement = screen.getByRole('time')
    expect(timeElement).toHaveTextContent(timestamp.toLocaleTimeString())
  })

  it('renders bold markdown text', () => {
    const message = createMockMessage('assistant', 'This is **bold** text')

    render(<ChatMessage message={message} variant="assistant" />)

    const strongElement = screen.getByText('bold')
    expect(strongElement.tagName).toBe('STRONG')
  })

  it('renders inline code markdown', () => {
    const message = createMockMessage('assistant', 'Use the `console.log` function')

    render(<ChatMessage message={message} variant="assistant" />)

    const codeElement = screen.getByText('console.log')
    expect(codeElement.tagName).toBe('CODE')
  })

  it('renders italic markdown text', () => {
    const message = createMockMessage('assistant', 'This is *italic* text')

    render(<ChatMessage message={message} variant="assistant" />)

    const emElement = screen.getByText('italic')
    expect(emElement.tagName).toBe('EM')
  })

  it('renders list items with bullet points', () => {
    const message = createMockMessage('assistant', '- First item\n- Second item')

    render(<ChatMessage message={message} variant="assistant" />)

    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Second item')).toBeInTheDocument()
  })
})
