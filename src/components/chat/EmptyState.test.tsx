import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  const mockOnQuestionClick = vi.fn()

  it('renders welcome message', () => {
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    expect(screen.getByText('Welcome to your CFO Bot')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    expect(
      screen.getByText(/Ask me anything about your agency's finances/)
    ).toBeInTheDocument()
  })

  it('renders example questions as clickable buttons', () => {
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    expect(screen.getByText('What does each employee cost me?')).toBeInTheDocument()
    expect(screen.getByText('What is my payroll ratio?')).toBeInTheDocument()
    expect(screen.getByText('Can I afford to hire someone new?')).toBeInTheDocument()
  })

  it('calls onQuestionClick with question text when button is clicked', async () => {
    const user = userEvent.setup()
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    const questionButton = screen.getByText('What does each employee cost me?')
    await user.click(questionButton)

    expect(mockOnQuestionClick).toHaveBeenCalledWith('What does each employee cost me?')
  })

  it('calls onQuestionClick for each different question', async () => {
    const user = userEvent.setup()
    const onQuestionClick = vi.fn()
    render(<EmptyState onQuestionClick={onQuestionClick} />)

    await user.click(screen.getByText('What is my payroll ratio?'))
    expect(onQuestionClick).toHaveBeenCalledWith('What is my payroll ratio?')

    await user.click(screen.getByText('Can I afford to hire someone new?'))
    expect(onQuestionClick).toHaveBeenCalledWith('Can I afford to hire someone new?')
  })

  it('renders "Try asking:" label', () => {
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    expect(screen.getByText('Try asking:')).toBeInTheDocument()
  })

  it('accepts and applies custom className', () => {
    const { container } = render(
      <EmptyState onQuestionClick={mockOnQuestionClick} className="custom-class" />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('renders exactly 3 example questions', () => {
    render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('has centered layout with minimum height', () => {
    const { container } = render(<EmptyState onQuestionClick={mockOnQuestionClick} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
    expect(wrapper).toHaveClass('min-h-[60vh]')
  })
})
