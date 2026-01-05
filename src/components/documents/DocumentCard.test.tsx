/**
 * Tests for DocumentCard component.
 * Story: 3.3 CSV File Upload
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #14, #15, #16: Smart summary, "Chat about this" primary action, progressive disclosure
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
    updatedAt: '2024-01-15T10:30:00Z',
    extractedData: {
      documentType: 'employees',
      employees: [
        { name: 'John', salary: 50000 },
        { name: 'Jane', salary: 60000 }
      ]
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnDelete.mockResolvedValue(undefined)
  })

  it('renders smart summary title for completed documents', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Smart summary generates title from filename
    expect(screen.getByText('Test File')).toBeInTheDocument()
  })

  it('renders filename for non-completed documents', () => {
    const pendingDoc = { ...mockDocument, processingStatus: 'pending' as const }
    render(<DocumentCard document={pendingDoc} onDelete={mockOnDelete} />)

    expect(screen.getByText('test-file.csv')).toBeInTheDocument()
  })

  it('renders file size in expanded view', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Expand to see file size
    await userEvent.click(screen.getByRole('button', { name: /More/i }))

    // File size appears in expanded metadata section
    const fileSizeElements = screen.getAllByText(/50 KB/)
    expect(fileSizeElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders upload date in expanded view', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Expand to see date
    await userEvent.click(screen.getByRole('button', { name: /More/i }))

    // Date appears in expanded metadata section
    const dateElements = screen.getAllByText(/Jan 15, 2024/)
    expect(dateElements.length).toBeGreaterThanOrEqual(1)
  })

  it('does not show status badge for completed documents', () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
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

  it('shows CSV type label when expanded', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Expand to see document type label
    await userEvent.click(screen.getByRole('button', { name: /More/i }))

    expect(screen.getByText('Employee Roster')).toBeInTheDocument()
  })

  it('shows row count when expanded', async () => {
    render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

    // Expand to see row count
    await userEvent.click(screen.getByRole('button', { name: /More/i }))

    expect(screen.getByText('25 rows')).toBeInTheDocument()
  })


  describe('Progressive disclosure - AC #16, #19, #20, #21', () => {
    it('shows preview metrics in collapsed state', () => {
      const plDoc: Document = {
        id: 'doc-pl',
        userId: 'user-1',
        filename: 'financial-report.pdf',
        fileType: 'pdf',
        fileSize: 1024 * 100,
        mimeType: 'application/pdf',
        storagePath: 'user-1/financial.pdf',
        processingStatus: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        // Use correct nested schema format
        extractedData: {
          documentType: 'pl',
          revenue: { total: 100000, lineItems: [] },
          expenses: { total: 80000, categories: [] }
        }
      }
      render(<DocumentCard document={plDoc} onDelete={mockOnDelete} />)

      // Should show preview metrics as "Label: value • Label: value" in collapsed state
      // Smart summary generates metrics like "Revenue: $100,000"
      expect(screen.getByText(/\$100,000/)).toBeInTheDocument()
    })

    it('shows More button to expand', () => {
      render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

      expect(screen.getByRole('button', { name: /More/i })).toBeInTheDocument()
    })

    it('expands to show full metrics when More is clicked', async () => {
      const plDoc: Document = {
        id: 'doc-pl',
        userId: 'user-1',
        filename: 'financial-report.pdf',
        fileType: 'pdf',
        fileSize: 1024 * 100,
        mimeType: 'application/pdf',
        storagePath: 'user-1/financial.pdf',
        processingStatus: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        // Use correct nested schema format
        extractedData: {
          documentType: 'pl',
          revenue: { total: 100000, lineItems: [] },
          expenses: { total: 80000, categories: [] }
        }
      }
      render(<DocumentCard document={plDoc} onDelete={mockOnDelete} />)

      // Click More
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

      // Should show all metrics (Net Income is calculated: revenue - expenses)
      expect(screen.getByText('Net Income')).toBeInTheDocument()
    })

    it('collapses back when Less is clicked', async () => {
      render(<DocumentCard document={mockDocument} onDelete={mockOnDelete} />)

      // Expand
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

      // Should show Less button
      expect(screen.getByRole('button', { name: /Less/i })).toBeInTheDocument()

      // Collapse
      await userEvent.click(screen.getByRole('button', { name: /Less/i }))

      // Should show More button again
      expect(screen.getByRole('button', { name: /More/i })).toBeInTheDocument()
    })
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

    it('renders smart summary title for PDF', () => {
      render(<DocumentCard document={mockPDFDocument} onDelete={mockOnDelete} />)

      // Smart summary generates title from filename (Q4-P&L-Report.pdf -> Q4 P&l Report)
      expect(screen.getByText('Q4 P&l Report')).toBeInTheDocument()
    })

    it('shows P&L schema label when expanded', async () => {
      render(<DocumentCard document={mockPDFDocument} onDelete={mockOnDelete} />)

      // Expand to see schema label
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

      expect(screen.getByText('P&L Statement')).toBeInTheDocument()
    })

    it('shows Payroll Report label when expanded', async () => {
      const payrollDoc = {
        ...mockPDFDocument,
        filename: 'payroll-jan.pdf',
        extractedData: {
          documentType: 'payroll',
          totals: { totalGrossPay: 50000 }
        }
      }
      render(<DocumentCard document={payrollDoc} onDelete={mockOnDelete} />)

      // Expand to see schema label
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

      expect(screen.getByText('Payroll Report')).toBeInTheDocument()
    })

    it('shows Document label when expanded for unknown PDF types', async () => {
      const unknownDoc = {
        ...mockPDFDocument,
        filename: 'random-file.pdf',
        extractedData: {
          documentType: 'unknown',
          rawContent: 'Some text'
        }
      }
      render(<DocumentCard document={unknownDoc} onDelete={mockOnDelete} />)

      // Expand to see schema label
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

      // Should show "Document" as schema label (not the smart summary title)
      const docLabels = screen.getAllByText('Document')
      expect(docLabels.length).toBeGreaterThanOrEqual(1)
    })

    it('does not show row count for PDF documents even when expanded', async () => {
      const pdfWithRowCount = {
        ...mockPDFDocument,
        rowCount: 10
      }
      render(<DocumentCard document={pdfWithRowCount} onDelete={mockOnDelete} />)

      // Expand the card
      await userEvent.click(screen.getByRole('button', { name: /More/i }))

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
