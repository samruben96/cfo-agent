import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { AgencyProfileForm } from './AgencyProfileForm'

import type { ProfileData } from '@/actions/profile'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock server actions
const mockUpdateProfile = vi.fn()
vi.mock('@/actions/profile', () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}))

// Mock sonner toast - must use vi.hoisted for proper hoisting
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockInitialData: ProfileData = {
  agencyName: 'Test Agency',
  annualRevenueRange: '$500K-$1M',
  employeeCount: 10,
  userRole: 'Owner',
  topFinancialQuestion: 'How can I increase profitability?',
  monthlyOverheadEstimate: 5000,
}

describe('AgencyProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateProfile.mockResolvedValue({ data: { success: true }, error: null })
    mockToastSuccess.mockClear()
    mockToastError.mockClear()
    mockPush.mockClear()
  })

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/annual revenue range/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/number of employees/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your role/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/biggest financial question/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/monthly overhead estimate/i)).toBeInTheDocument()
    })

    it('pre-fills form with initial data', () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      expect(screen.getByLabelText(/agency name/i)).toHaveValue('Test Agency')
      expect(screen.getByLabelText(/number of employees/i)).toHaveValue(10)
      expect(screen.getByLabelText(/biggest financial question/i)).toHaveValue(
        'How can I increase profitability?'
      )
      expect(screen.getByLabelText(/monthly overhead estimate/i)).toHaveValue(5000)
    })

    it('accepts className prop', () => {
      const { container } = render(
        <AgencyProfileForm initialData={mockInitialData} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('validation', () => {
    it('shows validation error for empty agency name', async () => {
      const emptyData: ProfileData = {
        ...mockInitialData,
        agencyName: '',
      }
      render(<AgencyProfileForm initialData={emptyData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      expect(screen.getByText(/agency name is required/i)).toBeInTheDocument()
    })

    it('shows validation error for empty employee count', async () => {
      const emptyData: ProfileData = {
        ...mockInitialData,
        employeeCount: null,
      }
      render(<AgencyProfileForm initialData={emptyData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      expect(screen.getByText(/employee count is required/i)).toBeInTheDocument()
    })

    it('shows validation error for empty financial question', async () => {
      const emptyData: ProfileData = {
        ...mockInitialData,
        topFinancialQuestion: '',
      }
      render(<AgencyProfileForm initialData={emptyData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      expect(screen.getByText(/top financial question is required/i)).toBeInTheDocument()
    })

    it('does not call updateProfile when validation fails', async () => {
      const emptyData: ProfileData = {
        ...mockInitialData,
        agencyName: '',
      }
      render(<AgencyProfileForm initialData={emptyData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })
  })

  describe('successful save', () => {
    it('calls updateProfile on valid submit', async () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(mockInitialData)
      })
    })

    it('shows success toast on successful save', async () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Profile updated successfully')
      })
    })

    it('shows loading state during save', async () => {
      // Make updateProfile take time to resolve
      mockUpdateProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true }, error: null }), 100))
      )

      render(<AgencyProfileForm initialData={mockInitialData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('shows error toast on failed save', async () => {
      mockUpdateProfile.mockResolvedValue({
        data: null,
        error: 'Failed to update profile',
      })

      render(<AgencyProfileForm initialData={mockInitialData} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to update profile')
      })
    })
  })

  describe('form interactions', () => {
    it('updates agency name on input change', async () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      const agencyInput = screen.getByLabelText(/agency name/i)
      await userEvent.clear(agencyInput)
      await userEvent.type(agencyInput, 'New Agency Name')

      expect(agencyInput).toHaveValue('New Agency Name')
    })

    it('updates employee count on input change', async () => {
      render(<AgencyProfileForm initialData={mockInitialData} />)

      const employeeInput = screen.getByLabelText(/number of employees/i)
      await userEvent.clear(employeeInput)
      await userEvent.type(employeeInput, '25')

      expect(employeeInput).toHaveValue(25)
    })
  })
})
