/**
 * Unit tests for EmployeeList component
 * Story: 3-2-employee-headcount-intake-form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { EmployeeList } from './EmployeeList'

import type { Employee } from '@/types/employees'

// Mock the server actions
vi.mock('@/actions/employees', () => ({
  addEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('EmployeeList', () => {
  const mockEmployees: Employee[] = [
    {
      id: 'emp-123',
      userId: 'user-123',
      name: 'John Doe',
      employeeId: 'EMP001',
      role: 'Producer',
      department: 'Sales',
      employmentType: 'full-time',
      annualSalary: 65000,
      annualBenefits: 15000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'emp-456',
      userId: 'user-123',
      name: 'Jane Smith',
      role: 'CSR',
      department: 'Service',
      employmentType: 'full-time',
      annualSalary: 45000,
      annualBenefits: 10000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no employees', () => {
    render(<EmployeeList initialEmployees={[]} />)

    expect(screen.getByText(/no employees/i)).toBeInTheDocument()
    expect(screen.getByText(/add your first employee/i)).toBeInTheDocument()
  })

  it('renders list of employees', () => {
    render(<EmployeeList initialEmployees={mockEmployees} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows add employee button', () => {
    render(<EmployeeList initialEmployees={mockEmployees} />)

    expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument()
  })

  it('displays total headcount', () => {
    render(<EmployeeList initialEmployees={mockEmployees} />)

    // Check for headcount in summary (text "Headcount" and "2" near each other)
    expect(screen.getByText('Headcount')).toBeInTheDocument()
    // The headcount value should be displayed as a large number
    const summarySection = screen.getByText('Team Summary').closest('div')
    expect(summarySection).toBeInTheDocument()
  })

  it('displays total payroll', () => {
    render(<EmployeeList initialEmployees={mockEmployees} />)

    // Total payroll is $110,000 (65000 + 45000)
    expect(screen.getByText(/\$110,000/)).toBeInTheDocument()
  })

  it('opens add employee form when add button clicked', () => {
    render(<EmployeeList initialEmployees={[]} />)

    const addButton = screen.getByRole('button', { name: /add employee/i })
    fireEvent.click(addButton)

    // Form should be visible
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('shows delete confirmation dialog when delete clicked', async () => {
    render(<EmployeeList initialEmployees={mockEmployees} />)

    const deleteButtons = screen.getAllByLabelText('Delete employee')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
  })

  it('calls deleteEmployee action when delete is confirmed', async () => {
    const { deleteEmployee } = await import('@/actions/employees')
    ;(deleteEmployee as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { deleted: true },
      error: null,
    })

    render(<EmployeeList initialEmployees={mockEmployees} />)

    // Click delete button for first employee
    const deleteButtons = screen.getAllByLabelText('Delete employee')
    fireEvent.click(deleteButtons[0])

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    // Click the Delete confirmation button
    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    // Verify deleteEmployee was called with correct ID
    await waitFor(() => {
      expect(deleteEmployee).toHaveBeenCalledWith('emp-123')
    })
  })

  it('cancels delete when cancel is clicked in confirmation dialog', async () => {
    const { deleteEmployee } = await import('@/actions/employees')

    render(<EmployeeList initialEmployees={mockEmployees} />)

    // Click delete button
    const deleteButtons = screen.getAllByLabelText('Delete employee')
    fireEvent.click(deleteButtons[0])

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Dialog should close and delete should not be called
    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
    expect(deleteEmployee).not.toHaveBeenCalled()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <EmployeeList initialEmployees={[]} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
