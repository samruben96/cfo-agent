import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { SuggestedQuestions } from './SuggestedQuestions'

describe('SuggestedQuestions', () => {
  const mockOnClick = vi.fn()
  const mockQuestions = [
    'How does this compare to industry benchmarks?',
    'Can I afford to hire another CSR?',
    'Show me the breakdown by department'
  ]

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('renders 2-3 suggestion buttons', () => {
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('renders correct question text on each button', () => {
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    expect(screen.getByText('How does this compare to industry benchmarks?')).toBeInTheDocument()
    expect(screen.getByText('Can I afford to hire another CSR?')).toBeInTheDocument()
    expect(screen.getByText('Show me the breakdown by department')).toBeInTheDocument()
  })

  it('calls onClick with correct question when button is clicked', async () => {
    const user = userEvent.setup()
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    const button = screen.getByText('Can I afford to hire another CSR?')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledWith('Can I afford to hire another CSR?')
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick for each different suggestion', async () => {
    const user = userEvent.setup()
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    await user.click(screen.getByText('How does this compare to industry benchmarks?'))
    expect(mockOnClick).toHaveBeenCalledWith('How does this compare to industry benchmarks?')

    await user.click(screen.getByText('Show me the breakdown by department'))
    expect(mockOnClick).toHaveBeenCalledWith('Show me the breakdown by department')
  })

  it('renders with only 2 questions', () => {
    const twoQuestions = ['Question 1?', 'Question 2?']
    render(<SuggestedQuestions questions={twoQuestions} onClick={mockOnClick} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('renders nothing when questions array is empty', () => {
    const { container } = render(<SuggestedQuestions questions={[]} onClick={mockOnClick} />)

    expect(container.firstChild).toBeNull()
  })

  it('uses ghost button variant for non-intrusive appearance', () => {
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      // Ghost variant doesn't have bg-primary, has hover:bg-accent
      expect(button).not.toHaveClass('bg-primary')
    })
  })

  it('uses small text size for buttons', () => {
    render(<SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('text-sm')
    })
  })

  it('accepts and applies custom className', () => {
    const { container } = render(
      <SuggestedQuestions
        questions={mockQuestions}
        onClick={mockOnClick}
        className="custom-class"
      />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('has proper gap spacing between buttons', () => {
    const { container } = render(
      <SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('gap-2')
  })

  it('uses flex-wrap layout for responsive behavior', () => {
    const { container } = render(
      <SuggestedQuestions questions={mockQuestions} onClick={mockOnClick} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('flex-wrap')
  })

  it('limits display to 3 suggestions maximum', () => {
    const manyQuestions = [
      'Question 1?',
      'Question 2?',
      'Question 3?',
      'Question 4?',
      'Question 5?'
    ]
    render(<SuggestedQuestions questions={manyQuestions} onClick={mockOnClick} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('provides accessible aria-labels for screen readers', () => {
    const questions = ['What is my payroll?', 'Show breakdown']
    render(<SuggestedQuestions questions={questions} onClick={mockOnClick} />)

    expect(screen.getByLabelText('Suggested question: What is my payroll?')).toBeInTheDocument()
    expect(screen.getByLabelText('Suggested question: Show breakdown')).toBeInTheDocument()
  })
})
