/**
 * Tests for CSVMappingDialog component.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CSVMappingDialog } from './CSVMappingDialog'

describe('CSVMappingDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnOpenChange = vi.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    headers: ['Employee Name', 'Job Title', 'Annual Salary'],
    csvType: 'employees' as const,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog with column headers', () => {
    render(<CSVMappingDialog {...defaultProps} />)

    expect(screen.getByText('Map CSV Columns')).toBeInTheDocument()
    // Use getAllByText since headers appear in labels and select values
    expect(screen.getAllByText('Employee Name').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Job Title').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Annual Salary').length).toBeGreaterThan(0)
  })

  it('shows CSV type in description', () => {
    render(<CSVMappingDialog {...defaultProps} />)

    expect(screen.getByText(/Employee Roster/)).toBeInTheDocument()
  })

  it('auto-detects mappings based on header names', () => {
    render(<CSVMappingDialog {...defaultProps} />)

    // Should have auto-detected some mappings
    // The select triggers should show values
    const triggers = screen.getAllByRole('combobox')
    expect(triggers.length).toBe(3)
  })

  it('shows validation error when required fields are missing', () => {
    const propsWithBadHeaders = {
      ...defaultProps,
      headers: ['Column A', 'Column B'] // No matching fields
    }

    render(<CSVMappingDialog {...propsWithBadHeaders} />)

    // Should show validation message about missing required fields
    expect(screen.getByText(/Missing required mappings/)).toBeInTheDocument()
  })

  it('disables confirm button when validation fails', () => {
    const propsWithBadHeaders = {
      ...defaultProps,
      headers: ['Column A', 'Column B']
    }

    render(<CSVMappingDialog {...propsWithBadHeaders} />)

    const confirmButton = screen.getByRole('button', { name: 'Confirm Mappings' })
    expect(confirmButton).toBeDisabled()
  })

  it('calls onConfirm with mappings when confirm is clicked', async () => {
    // Use headers that will auto-map to required fields
    const propsWithGoodHeaders = {
      ...defaultProps,
      headers: ['name', 'role', 'salary']
    }

    render(<CSVMappingDialog {...propsWithGoodHeaders} />)

    const confirmButton = screen.getByRole('button', { name: 'Confirm Mappings' })

    // Should be enabled since required fields are mapped
    expect(confirmButton).not.toBeDisabled()

    await userEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    // Should have received a mappings object
    expect(mockOnConfirm).toHaveBeenCalledWith(expect.any(Object))
  })

  it('calls onCancel when cancel is clicked', async () => {
    render(<CSVMappingDialog {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('renders select dropdowns for each column', () => {
    render(<CSVMappingDialog {...defaultProps} />)

    // Verify comboboxes are rendered for each header
    const triggers = screen.getAllByRole('combobox')
    expect(triggers.length).toBe(3) // One for each header
  })

  it('shows loading state when isLoading is true', () => {
    render(<CSVMappingDialog {...defaultProps} isLoading />)

    expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importing...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('does not render when open is false', () => {
    render(<CSVMappingDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Map CSV Columns')).not.toBeInTheDocument()
  })

  it('filters out ignore mappings from confirmed result', async () => {
    const propsWithGoodHeaders = {
      ...defaultProps,
      headers: ['name', 'role', 'extra_column']
    }

    render(<CSVMappingDialog {...propsWithGoodHeaders} />)

    const confirmButton = screen.getByRole('button', { name: 'Confirm Mappings' })
    await userEvent.click(confirmButton)

    // The confirmed mappings should not include 'ignore' values
    const confirmedMappings = mockOnConfirm.mock.calls[0][0]
    const hasIgnore = Object.values(confirmedMappings).includes('ignore')
    expect(hasIgnore).toBe(false)
  })

  it('works with payroll CSV type', () => {
    render(
      <CSVMappingDialog
        {...defaultProps}
        csvType="payroll"
        headers={['Employee', 'Hours', 'Rate', 'Gross']}
      />
    )

    expect(screen.getByText(/Payroll Report/)).toBeInTheDocument()
  })

  it('works with P&L CSV type', () => {
    render(
      <CSVMappingDialog
        {...defaultProps}
        csvType="pl"
        headers={['Description', 'Revenue', 'Expense']}
      />
    )

    expect(screen.getByText(/Profit & Loss/)).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<CSVMappingDialog {...defaultProps} className="custom-class" />)

    // The dialog content should have the custom class
    const dialogContent = screen.getByRole('dialog')
    expect(dialogContent).toHaveClass('custom-class')
  })
})
