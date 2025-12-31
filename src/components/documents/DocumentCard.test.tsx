/**
 * Tests for DocumentCard component.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DocumentCard } from './DocumentCard'

import type { Document } from '@/types/documents'

describe('DocumentCard', () => {
  const mockOnDelete = vi.fn()
  const mockOnView = vi.fn()

  const mockDocument: Document = {
    id: 'doc-1',
    userId: 'user-1',
    filename: 'test-file.csv',
    fileType: 'csv',
    fileSize: 1024 * 50, // 50 KB
    mimeType: 'text/csv',
    storagePath: 'user-1/123.csv',
    processingStatus: 'completed',
    csvType: 'employees',
    rowCount: 25,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnDelete.mockResolvedValue(undefined)
  })

  it('renders document filename', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText('test-file.csv')).toBeInTheDocument()
  })

  it('renders file size formatted correctly', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText(/50 KB/)).toBeInTheDocument()
  })

  it('renders upload date', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
  })

  it('shows completed status badge', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows pending status badge', () => {
    const pendingDoc = { ...mockDocument, processingStatus: 'pending' as const }
    render(<DocumentCard document={pendingDoc} onDelete={mockOnDelete} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows processing status badge', () => {
    const processingDoc = { ...mockDocument, processingStatus: 'processing' as const }
    render(<DocumentCard document={processingDoc} onDelete={mockOnDelete} />)

    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('shows error status badge', () => {
    const errorDoc = {
      ...mockDocument,
      processingStatus: 'error' as const,
      errorMessage: 'Failed to parse CSV'
    }
    render(<DocumentCard document={errorDoc} onDelete={mockOnDelete} />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Failed to parse CSV')).toBeInTheDocument()
  })

  it('shows CSV type label when completed', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText('Employee Roster')).toBeInTheDocument()
  })

  it('shows row count when completed', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.getByText('25 rows')).toBeInTheDocument()
  })

  it('shows View Data button when completed and onView is provided', () => {
    render(
      <DocumentCard
        document={mockDocument}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    expect(screen.getByRole('button', { name: 'View Data' })).toBeInTheDocument()
  })

  it('does not show View Data button when not completed', () => {
    const pendingDoc = { ...mockDocument, processingStatus: 'pending' as const }
    render(
      <DocumentCard
        document={pendingDoc}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    expect(screen.queryByRole('button', { name: 'View Data' })).not.toBeInTheDocument()
  })

  it('calls onView when View Data button is clicked', async () => {
    render(
      <DocumentCard
        document={mockDocument}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'View Data' }))

    expect(mockOnView).toHaveBeenCalledWith(mockDocument)
  })

  it('shows delete confirmation dialog when delete is clicked', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Click the delete button (has sr-only text)
    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    await userEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(screen.getByText('Delete Document')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
  })

  it('calls onDelete when delete is confirmed', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: 'Delete' })
    await userEvent.click(confirmButton)

    expect(mockOnDelete).toHaveBeenCalledWith('doc-1')
  })

  it('cancels delete when Cancel is clicked', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    // Cancel
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <DocumentCard
        document={mockDocument}
        onDelete={mockOnDelete}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  describe('PDF document display', () => {
    const mockPDFDocument: Document = {
      id: 'doc-2',
      userId: 'user-1',
      filename: 'Q4-P&L-Report.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 200, // 200 KB
      mimeType: 'application/pdf',
      storagePath: 'user-1/456.pdf',
      processingStatus: 'completed',
      extractedData: {
        documentType: 'pl',
        revenue: { total: 100000 },
        expenses: { total: 75000 },
        netIncome: 25000
      },
      createdAt: '2024-01-20T14:00:00Z',
      updatedAt: '2024-01-20T14:00:00Z'
    }

    it('renders PDF filename', () => {
      render(<DocumentCard document={mockPDFDocument} onDelete={mockOnDelete} />)

      expect(screen.getByText('Q4-P&L-Report.pdf')).toBeInTheDocument()
    })

    it('shows P&L schema label for P&L documents', () => {
      render(<DocumentCard document={mockPDFDocument} onDelete={mockOnDelete} />)

      expect(screen.getByText('P&L Statement')).toBeInTheDocument()
    })

    it('shows Payroll Report label for payroll documents', () => {
      const payrollDoc = {
        ...mockPDFDocument,
        filename: 'payroll-jan.pdf',
        extractedData: {
          documentType: 'payroll',
          totals: { totalGrossPay: 50000 }
        }
      }
      render(<DocumentCard document={payrollDoc} onDelete={mockOnDelete} />)

      expect(screen.getByText('Payroll Report')).toBeInTheDocument()
    })

    it('shows Document label for unknown PDF types', () => {
      const unknownDoc = {
        ...mockPDFDocument,
        filename: 'document.pdf',
        extractedData: {
          documentType: 'unknown',
          rawContent: 'Some text'
        }
      }
      render(<DocumentCard document={unknownDoc} onDelete={mockOnDelete} />)

      expect(screen.getByText('Document')).toBeInTheDocument()
    })

    it('does not show row count for PDF documents', () => {
      const pdfWithRowCount = {
        ...mockPDFDocument,
        rowCount: 10
      }
      render(<DocumentCard document={pdfWithRowCount} onDelete={mockOnDelete} />)

      expect(screen.queryByText('10 rows')).not.toBeInTheDocument()
    })

    it('shows View Data button for completed PDF', () => {
      render(
        <DocumentCard
          document={mockPDFDocument}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByRole('button', { name: 'View Data' })).toBeInTheDocument()
    })
  })
})
