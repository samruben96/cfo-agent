import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { OnboardingContainer } from './OnboardingContainer'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock server actions
const mockSaveOnboardingStep = vi.fn()
const mockCompleteOnboarding = vi.fn()
vi.mock('@/actions/onboarding', () => ({
  saveOnboardingStep: (...args: unknown[]) => mockSaveOnboardingStep(...args),
  completeOnboarding: () => mockCompleteOnboarding(),
}))

describe('OnboardingContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveOnboardingStep.mockResolvedValue({ data: { step: 1 }, error: null })
    mockCompleteOnboarding.mockResolvedValue({ data: { redirectTo: '/chat' }, error: null })
  })

  describe('initial rendering', () => {
    it('renders first question initially', () => {
      render(<OnboardingContainer />)

      expect(screen.getByText(/what's your agency name/i)).toBeInTheDocument()
    })

    it('displays welcome message on first step', () => {
      render(<OnboardingContainer />)

      expect(screen.getByText(/welcome! let's get to know your agency/i)).toBeInTheDocument()
    })

    it('shows progress indicator', () => {
      render(<OnboardingContainer />)

      expect(screen.getByText(/question 1 of 6/i)).toBeInTheDocument()
    })
  })

  describe('resuming from saved step', () => {
    it('resumes from saved step', () => {
      render(<OnboardingContainer initialStep={2} />)

      // Should be on third question (employee count)
      expect(screen.getByText(/how many employees/i)).toBeInTheDocument()
      expect(screen.getByText(/question 3 of 6/i)).toBeInTheDocument()
    })

    it('pre-fills saved answers', () => {
      render(
        <OnboardingContainer
          initialStep={0}
          initialAnswers={{ agency_name: 'Test Agency' }}
        />
      )

      const input = screen.getByPlaceholderText(/enter your answer/i)
      expect(input).toHaveValue('Test Agency')
    })
  })

  describe('step navigation', () => {
    it('advances to next question on next click', async () => {
      render(<OnboardingContainer />)

      // Fill in first question
      const input = screen.getByPlaceholderText(/enter your answer/i)
      await userEvent.type(input, 'My Agency')

      // Click next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      // Should show second question
      await waitFor(() => {
        expect(screen.getByText(/annual revenue range/i)).toBeInTheDocument()
      })
    })

    it('saves answer via server action', async () => {
      render(<OnboardingContainer />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      await userEvent.type(input, 'Test Agency')

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(mockSaveOnboardingStep).toHaveBeenCalledWith(
          'agency_name',
          'Test Agency',
          1
        )
      })
    })
  })

  describe('completion', () => {
    it('completes onboarding after last question', async () => {
      // Start at last question (monthly_overhead - step 5)
      render(<OnboardingContainer initialStep={5} />)

      // Skip optional question
      const skipButton = screen.getByRole('button', { name: /skip/i })
      await userEvent.click(skipButton)

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalled()
      })
    })

    it('redirects to chat on completion', async () => {
      render(<OnboardingContainer initialStep={5} />)

      const skipButton = screen.getByRole('button', { name: /skip/i })
      await userEvent.click(skipButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/chat')
      })
    })
  })

  describe('error handling', () => {
    it('displays error from server action', async () => {
      mockSaveOnboardingStep.mockResolvedValue({
        data: null,
        error: 'Failed to save progress',
      })

      render(<OnboardingContainer />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      await userEvent.type(input, 'Test Agency')

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to save progress/i)).toBeInTheDocument()
      })
    })

    it('stays on current step when save fails', async () => {
      mockSaveOnboardingStep.mockResolvedValue({
        data: null,
        error: 'Failed to save progress',
      })

      render(<OnboardingContainer />)

      const input = screen.getByPlaceholderText(/enter your answer/i)
      await userEvent.type(input, 'Test Agency')

      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      await waitFor(() => {
        // Still on first question
        expect(screen.getByText(/what's your agency name/i)).toBeInTheDocument()
      })
    })
  })

  describe('className prop', () => {
    it('accepts className prop', () => {
      const { container } = render(<OnboardingContainer className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
