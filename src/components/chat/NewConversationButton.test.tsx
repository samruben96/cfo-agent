import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { NewConversationButton } from './NewConversationButton'

describe('NewConversationButton', () => {
  it('renders the button with correct text', () => {
    render(<NewConversationButton onClick={() => {}} />)

    // Button is identified by its aria-label
    const button = screen.getByRole('button', { name: /start new conversation/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('New Chat')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<NewConversationButton onClick={onClick} />)

    const button = screen.getByRole('button', { name: /start new conversation/i })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<NewConversationButton onClick={() => {}} disabled />)

    const button = screen.getByRole('button', { name: /start new conversation/i })
    expect(button).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<NewConversationButton onClick={onClick} disabled />)

    const button = screen.getByRole('button', { name: /start new conversation/i })
    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<NewConversationButton onClick={() => {}} className="custom-class" />)

    const button = screen.getByRole('button', { name: /start new conversation/i })
    expect(button).toHaveClass('custom-class')
  })

  it('has accessible aria-label', () => {
    render(<NewConversationButton onClick={() => {}} />)

    const button = screen.getByLabelText('Start new conversation')
    expect(button).toBeInTheDocument()
  })

  it('displays Plus icon', () => {
    const { container } = render(<NewConversationButton onClick={() => {}} />)

    // lucide-react renders SVG elements
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
