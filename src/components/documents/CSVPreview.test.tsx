/**
 * Tests for CSVPreview component.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CSVPreview } from './CSVPreview'

import type { ParsedCSVData } from '@/types/documents'

describe('CSVPreview', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnChangeType = vi.fn()

  const mockData: ParsedCSVData = {
    headers: ['name', 'role', 'salary'],
    rows: [
      { name: 'John Doe', role: 'Developer', salary: 80000 },
      { name: 'Jane Smith', role: 'Designer', salary: 75000 },
      { name: 'Bob Wilson', role: 'Manager', salary: 90000 }
    ],
    totalRows: 3,
    detectedType: 'employees',
    confidence: 0.85
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders preview with headers and data rows', () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // Check headers
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('role')).toBeInTheDocument()
    expect(screen.getByText('salary')).toBeInTheDocument()

    // Check data rows
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('80,000')).toBeInTheDocument() // Formatted number
  })

  it('shows detected CSV type with confidence', () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Employee Roster')).toBeInTheDocument()
    expect(screen.getByText('85% confidence')).toBeInTheDocument()
  })

  it('shows row count summary', () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Showing 3 of 3 rows/)).toBeInTheDocument()
  })

  it('limits preview to first 10 rows', () => {
    const manyRowsData: ParsedCSVData = {
      ...mockData,
      rows: Array.from({ length: 50 }, (_, i) => ({
        name: `Person ${i}`,
        role: 'Worker',
        salary: 50000
      })),
      totalRows: 50
    }

    render(
      <CSVPreview
        data={manyRowsData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Showing 10 of 50 rows/)).toBeInTheDocument()
    expect(screen.getByText('Person 0')).toBeInTheDocument()
    expect(screen.getByText('Person 9')).toBeInTheDocument()
    expect(screen.queryByText('Person 10')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirm Import' })
    await userEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('disables buttons when isLoading is true', () => {
    render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading
      />
    )

    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('shows type selection options when type is unknown', () => {
    const unknownData: ParsedCSVData = {
      ...mockData,
      detectedType: 'unknown',
      confidence: 0
    }

    render(
      <CSVPreview
        data={unknownData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onChangeType={mockOnChangeType}
      />
    )

    expect(screen.getByText('Unable to detect CSV type. Please select:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profit & Loss' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Payroll Report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Employee Roster' })).toBeInTheDocument()
  })

  it('disables confirm button when type is unknown', () => {
    const unknownData: ParsedCSVData = {
      ...mockData,
      detectedType: 'unknown',
      confidence: 0
    }

    render(
      <CSVPreview
        data={unknownData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onChangeType={mockOnChangeType}
      />
    )

    expect(screen.getByRole('button', { name: 'Confirm Import' })).toBeDisabled()
  })

  it('calls onChangeType when type selection button is clicked', async () => {
    const unknownData: ParsedCSVData = {
      ...mockData,
      detectedType: 'unknown',
      confidence: 0
    }

    render(
      <CSVPreview
        data={unknownData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onChangeType={mockOnChangeType}
      />
    )

    const plButton = screen.getByRole('button', { name: 'Profit & Loss' })
    await userEvent.click(plButton)

    expect(mockOnChangeType).toHaveBeenCalledWith('pl')
  })

  it('shows empty state when no data rows', () => {
    const emptyData: ParsedCSVData = {
      ...mockData,
      rows: [],
      totalRows: 0
    }

    render(
      <CSVPreview
        data={emptyData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('No data to preview')).toBeInTheDocument()
  })

  it('formats numbers with locale-aware formatting', () => {
    const dataWithNumbers: ParsedCSVData = {
      headers: ['item', 'price'],
      rows: [{ item: 'Widget', price: 1234567.89 }],
      totalRows: 1,
      detectedType: 'pl',
      confidence: 0.9
    }

    render(
      <CSVPreview
        data={dataWithNumbers}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // Should be formatted with commas
    expect(screen.getByText('1,234,567.89')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <CSVPreview
        data={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
