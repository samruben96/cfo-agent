/**
 * Unit tests for OverheadCostForm component
 * Story: 3-1-overhead-cost-intake-form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { OverheadCostForm } from './OverheadCostForm'

import type { OverheadCosts } from '@/types/overhead-costs'

// Mock navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock server actions
const mockSaveOverheadCosts = vi.fn()
vi.mock('@/actions/overhead-costs', () => ({
  saveOverheadCosts: (data: unknown) => mockSaveOverheadCosts(data),
}))

describe('OverheadCostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockInitialData: OverheadCosts = {
    id: 'overhead-123',
    userId: 'user-123',
    monthlyRent: 2000,
    monthlyUtilities: 150,
    monthlyInsurance: 500,
    otherMonthlyCosts: 100,
    softwareCosts: [
      { id: 'software-1', name: 'Slack', monthlyCost: 25 },
      { id: 'software-2', name: 'QuickBooks', monthlyCost: 50 },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }

  describe('rendering', () => {
    it('renders empty form when no initial data', () => {
      render(<OverheadCostForm initialData={null} />)

      expect(screen.getByLabelText('Monthly Rent')).toHaveValue(null)
      expect(screen.getByLabelText('Monthly Utilities')).toHaveValue(null)
      expect(screen.getByLabelText('Monthly Insurance')).toHaveValue(null)
      expect(screen.getByLabelText('Other Monthly Costs')).toHaveValue(null)
      expect(screen.getByText('Add Software')).toBeInTheDocument()
    })

    it('renders form with pre-filled data', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      expect(screen.getByLabelText('Monthly Rent')).toHaveValue(2000)
      expect(screen.getByLabelText('Monthly Utilities')).toHaveValue(150)
      expect(screen.getByLabelText('Monthly Insurance')).toHaveValue(500)
      expect(screen.getByLabelText('Other Monthly Costs')).toHaveValue(100)
    })

    it('renders software cost items when data exists', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      const nameInputs = screen.getAllByLabelText('Software name')
      expect(nameInputs).toHaveLength(2)
      expect(nameInputs[0]).toHaveValue('Slack')
      expect(nameInputs[1]).toHaveValue('QuickBooks')
    })

    it('save button is disabled when form is not dirty', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      expect(screen.getByRole('button', { name: 'Save Overhead Costs' })).toBeDisabled()
    })
  })

  describe('form interactions', () => {
    it('enables save button when form is changed', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      const rentInput = screen.getByLabelText('Monthly Rent')
      fireEvent.change(rentInput, { target: { value: '2500' } })

      expect(screen.getByRole('button', { name: 'Save Overhead Costs' })).not.toBeDisabled()
    })

    it('adds new software item when Add Software is clicked', () => {
      render(<OverheadCostForm initialData={null} />)

      fireEvent.click(screen.getByText('Add Software'))

      expect(screen.getByLabelText('Software name')).toBeInTheDocument()
    })

    it('removes software item when remove button is clicked', async () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      const removeButtons = screen.getAllByLabelText('Remove software')
      expect(removeButtons).toHaveLength(2)

      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.getAllByLabelText('Software name')).toHaveLength(1)
      })
    })

    it('updates software item when values change', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      const nameInputs = screen.getAllByLabelText('Software name')
      fireEvent.change(nameInputs[0], { target: { value: 'Teams' } })

      expect(nameInputs[0]).toHaveValue('Teams')
    })
  })

  describe('validation', () => {
    it('displays inline error for negative rent value', async () => {
      render(<OverheadCostForm initialData={null} />)

      const rentInput = screen.getByLabelText('Monthly Rent')
      fireEvent.change(rentInput, { target: { value: '-100' } })

      // Submit the form
      const form = screen.getByRole('button', { name: 'Save Overhead Costs' }).closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Monthly Rent must be a positive number')).toBeInTheDocument()
      })

      // Server action should not be called when validation fails
      expect(mockSaveOverheadCosts).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('calls saveOverheadCosts with correct data on submit', async () => {
      mockSaveOverheadCosts.mockResolvedValue({
        data: mockInitialData,
        error: null,
      })

      render(<OverheadCostForm initialData={null} />)

      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '2000' } })
      fireEvent.change(screen.getByLabelText('Monthly Utilities'), { target: { value: '150' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Overhead Costs' }))

      await waitFor(() => {
        expect(mockSaveOverheadCosts).toHaveBeenCalledWith({
          monthlyRent: 2000,
          monthlyUtilities: 150,
          monthlyInsurance: null,
          otherMonthlyCosts: null,
          softwareCosts: [],
        })
      })
    })

    it('shows success toast on successful save', async () => {
      const { toast } = await import('sonner')
      mockSaveOverheadCosts.mockResolvedValue({
        data: mockInitialData,
        error: null,
      })

      render(<OverheadCostForm initialData={null} />)

      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '2000' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Overhead Costs' }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Overhead costs saved successfully')
      })
    })

    it('shows error toast on save failure', async () => {
      const { toast } = await import('sonner')
      mockSaveOverheadCosts.mockResolvedValue({
        data: null,
        error: 'Failed to save',
      })

      render(<OverheadCostForm initialData={null} />)

      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '2000' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Overhead Costs' }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save')
      })
    })

    it('disables save button during submission', async () => {
      mockSaveOverheadCosts.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockInitialData, error: null }), 100))
      )

      render(<OverheadCostForm initialData={null} />)

      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '2000' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Overhead Costs' }))

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    })
  })

  describe('className prop', () => {
    it('applies className to form element', () => {
      const { container } = render(
        <OverheadCostForm initialData={null} className="custom-form-class" />
      )

      expect(container.querySelector('form')).toHaveClass('custom-form-class')
    })
  })

  describe('unsaved changes dialog', () => {
    it('shows dialog when navigating with unsaved changes', async () => {
      render(<OverheadCostForm initialData={null} />)

      // Make the form dirty
      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '1000' } })

      // Simulate navigation attempt via window handler
      const windowWithHandler = window as { __handleSettingsNavigation?: (href: string) => void }
      windowWithHandler.__handleSettingsNavigation?.('/chat')

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })
    })

    it('navigates without dialog when form is not dirty', () => {
      render(<OverheadCostForm initialData={mockInitialData} />)

      // Form is not dirty - navigate should work without dialog
      const windowWithHandler = window as { __handleSettingsNavigation?: (href: string) => void }
      windowWithHandler.__handleSettingsNavigation?.('/chat')

      // Dialog should not appear
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })

    it('discards changes and navigates when clicking Discard Changes', async () => {
      render(<OverheadCostForm initialData={null} />)

      // Make the form dirty
      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '1000' } })

      // Trigger navigation
      const windowWithHandler = window as { __handleSettingsNavigation?: (href: string) => void }
      windowWithHandler.__handleSettingsNavigation?.('/chat')

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })

      // Click discard
      fireEvent.click(screen.getByText('Discard Changes'))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/chat')
      })
    })

    it('saves and navigates when clicking Save & Leave', async () => {
      mockSaveOverheadCosts.mockResolvedValue({
        data: { ...mockInitialData, monthlyRent: 1000 },
        error: null,
      })

      render(<OverheadCostForm initialData={null} />)

      // Make the form dirty
      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '1000' } })

      // Trigger navigation
      const windowWithHandler = window as { __handleSettingsNavigation?: (href: string) => void }
      windowWithHandler.__handleSettingsNavigation?.('/chat')

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })

      // Click save & leave
      fireEvent.click(screen.getByText('Save & Leave'))

      await waitFor(() => {
        expect(mockSaveOverheadCosts).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/chat')
      })
    })

    it('closes dialog when clicking Cancel', async () => {
      render(<OverheadCostForm initialData={null} />)

      // Make the form dirty
      fireEvent.change(screen.getByLabelText('Monthly Rent'), { target: { value: '1000' } })

      // Trigger navigation
      const windowWithHandler = window as { __handleSettingsNavigation?: (href: string) => void }
      windowWithHandler.__handleSettingsNavigation?.('/chat')

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
      })

      // Should not have navigated
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
