import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn()
  }

  it('renders textarea with placeholder', () => {
    render(<ChatInput {...defaultProps} />)

    expect(screen.getByPlaceholderText('Ask your CFO anything...')).toBeInTheDocument()
  })

  it('renders send button with accessible label', () => {
    render(<ChatInput {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
  })

  it('calls onChange when typing in textarea', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} onChange={onChange} />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    await user.type(textarea, 'test')

    expect(onChange).toHaveBeenCalled()
  })

  it('calls onSubmit when form is submitted via button click', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    const user = userEvent.setup()
    render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(onSubmit).toHaveBeenCalled()
  })

  it('submits on Enter key press', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalled()
  })

  it('does not submit on Shift+Enter', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when value is empty', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} value="" onSubmit={onSubmit} />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when value is only whitespace', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} value="   " onSubmit={onSubmit} />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables textarea when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled />)

    const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
    expect(textarea).toBeDisabled()
  })

  it('disables button when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('disables button when value is empty', () => {
    render(<ChatInput {...defaultProps} value="" />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('enables button when value has content', () => {
    render(<ChatInput {...defaultProps} value="test" />)

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  it('accepts and applies custom className', () => {
    const { container } = render(<ChatInput {...defaultProps} className="custom-class" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })
})
