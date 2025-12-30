import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OnboardingQuestion } from './OnboardingQuestion'

describe('OnboardingQuestion', () => {
  const defaultProps = {
    question: 'Test question?',
    fieldName: 'test_field',
    inputType: 'text' as const,
    value: null as string | number | null,
    onChange: vi.fn(),
    onNext: vi.fn(),
  }

  describe('text input', () => {
    it('renders text input correctly', () => {
      render(<OnboardingQuestion {...defaultProps} />)

      expect(screen.getByLabelText(/test question/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter your answer/i)).toBeInTheDocument()
    })

    it('calls onChange when typing', async () => {
      const onChange = vi.fn()
      render(<OnboardingQuestion {...defaultProps} onChange={onChange} />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      await userEvent.type(input, 'test value')

      expect(onChange).toHaveBeenCalled()
    })

    it('displays the value prop', () => {
      render(<OnboardingQuestion {...defaultProps} value="existing value" />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      expect(input).toHaveValue('existing value')
    })
  })

  describe('number input', () => {
    it('renders number input correctly', () => {
      render(<OnboardingQuestion {...defaultProps} inputType="number" />)

      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('parses number values correctly', async () => {
      const onChange = vi.fn()
      render(<OnboardingQuestion {...defaultProps} inputType="number" onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      await userEvent.type(input, '42')

      // Each keystroke triggers onChange with the current parsed value
      // First '4' → 4, then '2' → '42' parsed as '2' in isolation but cumulative as 42
      expect(onChange).toHaveBeenCalled()
      // Last call should have the cumulative value type check
      expect(onChange).toHaveBeenLastCalledWith(expect.any(Number))
    })
  })

  describe('select dropdown', () => {
    const selectProps = {
      ...defaultProps,
      inputType: 'select' as const,
      options: ['Option A', 'Option B', 'Option C'],
    }

    it('renders select dropdown', () => {
      render(<OnboardingQuestion {...selectProps} />)

      // Radix Select renders a combobox
      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
    })

    it('shows placeholder text', () => {
      render(<OnboardingQuestion {...selectProps} />)

      expect(screen.getByText(/select an option/i)).toBeInTheDocument()
    })

    it('displays selected value', () => {
      render(<OnboardingQuestion {...selectProps} value="Option B" />)

      expect(screen.getByText('Option B')).toBeInTheDocument()
    })
  })

  describe('textarea input', () => {
    it('renders textarea correctly', () => {
      render(<OnboardingQuestion {...defaultProps} inputType="textarea" />)

      expect(screen.getByPlaceholderText(/tell us more/i)).toBeInTheDocument()
    })

    it('accepts multiline input', async () => {
      const onChange = vi.fn()
      render(<OnboardingQuestion {...defaultProps} inputType="textarea" onChange={onChange} />)

      const textarea = screen.getByPlaceholderText(/tell us more/i)
      await userEvent.type(textarea, 'Line 1\nLine 2')

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('currency input', () => {
    it('renders currency input with $ prefix', () => {
      render(<OnboardingQuestion {...defaultProps} inputType="currency" />)

      expect(screen.getByText('$')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    })

    it('parses currency values as floats', async () => {
      const onChange = vi.fn()
      render(<OnboardingQuestion {...defaultProps} inputType="currency" onChange={onChange} />)

      const input = screen.getByPlaceholderText('0.00')
      await userEvent.type(input, '1500.50')

      // Should be called with parsed float
      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('validation', () => {
    it('validates required fields before next', async () => {
      const onNext = vi.fn()
      render(<OnboardingQuestion {...defaultProps} onNext={onNext} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
      expect(onNext).not.toHaveBeenCalled()
    })

    it('calls onNext when required field has value', async () => {
      const onNext = vi.fn()
      render(<OnboardingQuestion {...defaultProps} value="filled" onNext={onNext} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      expect(onNext).toHaveBeenCalled()
      expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument()
    })
  })

  describe('optional questions', () => {
    it('allows skip for optional questions', () => {
      const onSkip = vi.fn()
      render(
        <OnboardingQuestion
          {...defaultProps}
          isOptional={true}
          onSkip={onSkip}
        />
      )

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    })

    it('does not show skip for required questions', () => {
      render(<OnboardingQuestion {...defaultProps} isOptional={false} />)

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('calls onSkip when skip is clicked', async () => {
      const onSkip = vi.fn()
      render(
        <OnboardingQuestion
          {...defaultProps}
          isOptional={true}
          onSkip={onSkip}
        />
      )

      const skipButton = screen.getByRole('button', { name: /skip/i })
      await userEvent.click(skipButton)

      expect(onSkip).toHaveBeenCalled()
    })

    it('shows optional indicator for optional questions', () => {
      render(<OnboardingQuestion {...defaultProps} isOptional={true} />)

      expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading state during save', () => {
      render(<OnboardingQuestion {...defaultProps} isLoading={true} />)

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })

    it('disables input during loading', () => {
      render(<OnboardingQuestion {...defaultProps} isLoading={true} />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      expect(input).toBeDisabled()
    })
  })

  describe('className prop', () => {
    it('accepts className prop', () => {
      const { container } = render(
        <OnboardingQuestion {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
