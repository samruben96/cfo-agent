import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OnboardingProgress } from './OnboardingProgress'

describe('OnboardingProgress', () => {
  const defaultProps = {
    currentStep: 3,
    totalSteps: 6,
  }

  describe('step display', () => {
    it('displays current step and total', () => {
      render(<OnboardingProgress {...defaultProps} />)

      expect(screen.getByText(/question 3 of 6/i)).toBeInTheDocument()
    })

    it('displays correct step for step 1', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={6} />)

      expect(screen.getByText(/question 1 of 6/i)).toBeInTheDocument()
    })

    it('displays correct step for last step', () => {
      render(<OnboardingProgress currentStep={6} totalSteps={6} />)

      expect(screen.getByText(/question 6 of 6/i)).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('renders progress bar with correct width', () => {
      render(<OnboardingProgress currentStep={3} totalSteps={6} />)

      // Should show 50%
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows 0% at step 0', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={6} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('shows 100% at completion', () => {
      render(<OnboardingProgress currentStep={6} totalSteps={6} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('rounds percentage correctly', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={3} />)

      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  describe('progress element', () => {
    it('renders progress element', () => {
      render(<OnboardingProgress currentStep={3} totalSteps={6} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('className prop', () => {
    it('accepts className prop', () => {
      const { container } = render(
        <OnboardingProgress {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
