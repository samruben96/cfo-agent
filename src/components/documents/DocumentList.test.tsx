/**
 * Tests for DocumentList component.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DocumentList } from './DocumentList'

import type { Document } from '@/types/documents'

describe('DocumentList', () => {
  const mockOnDelete = vi.fn()
  const mockOnView = vi.fn()

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      userId: 'user-1',
      filename: 'employees.csv',
      fileType: 'csv',
      fileSize: 1024,
      mimeType: 'text/csv',
      storagePath: 'user-1/123.csv',
      processingStatus: 'completed',
      csvType: 'employees',
      rowCount: 10,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'doc-2',
      userId: 'user-1',
      filename: 'payroll.csv',
      fileType: 'csv',
      fileSize: 2048,
      mimeType: 'text/csv',
      storagePath: 'user-1/456.csv',
      processingStatus: 'pending',
      createdAt: '2024-01-16T10:30:00Z',
      updatedAt: '2024-01-16T10:30:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnDelete.mockResolvedValue(undefined)
  })

  it('renders empty state when no documents', () => {
    render(
      <DocumentList
        documents={[]}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('No documents yet')).toBeInTheDocument()
    expect(screen.getByText(/Upload a CSV or PDF file/)).toBeInTheDocument()
  })

  it('renders CSV-specific empty state when filter is csv', () => {
    render(
      <DocumentList
        documents={[]}
        onDelete={mockOnDelete}
        fileTypeFilter="csv"
      />
    )

    expect(screen.getByText('No CSV files')).toBeInTheDocument()
    expect(screen.getByText(/Upload a CSV file to import spreadsheet data/)).toBeInTheDocument()
  })

  it('renders PDF-specific empty state when filter is pdf', () => {
    render(
      <DocumentList
        documents={[]}
        onDelete={mockOnDelete}
        fileTypeFilter="pdf"
      />
    )

    expect(screen.getByText('No PDF files')).toBeInTheDocument()
    expect(screen.getByText(/Upload a PDF document like a P&L report/)).toBeInTheDocument()
  })

  it('renders list of documents', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('employees.csv')).toBeInTheDocument()
    expect(screen.getByText('payroll.csv')).toBeInTheDocument()
  })

  it('renders correct number of document cards', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
      />
    )

    // Each document should have a delete button
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    expect(deleteButtons.length).toBe(2)
  })

  it('passes onView to document cards when provided', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    // Should show View Data button for completed documents
    expect(screen.getByRole('button', { name: 'View Data' })).toBeInTheDocument()
  })

  it('does not show View Data for pending documents', () => {
    const pendingOnlyDocs = [mockDocuments[1]] // Only the pending document

    render(
      <DocumentList
        documents={pendingOnlyDocs}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    expect(screen.queryByRole('button', { name: 'View Data' })).not.toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows different status badges for different documents', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})
