/**
 * Tests for DocumentsSidePanel component
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #12, #13: Collapsible side panel showing recent documents with smart summaries
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentsSidePanel } from './DocumentsSidePanel'
import type { Document } from '@/types/documents'

// Helper to create mock documents
function createMockDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    userId: 'user-123',
    filename: 'test-document.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    storagePath: 'user-123/test.pdf',
    processingStatus: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    // Use correct nested schema format for extractedData
    extractedData: {
      documentType: 'pl',
      revenue: { total: 100000, lineItems: [] },
      expenses: { total: 80000, categories: [] }
    },
    ...overrides
  }
}

describe('DocumentsSidePanel', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    documents: [createMockDocument()]
  }

  describe('Panel visibility', () => {
    it('renders when open is true', () => {
      render(<DocumentsSidePanel {...defaultProps} />)

      expect(screen.getByText('My Documents')).toBeInTheDocument()
    })

    it('has translate-x-full class when closed', () => {
      const { container } = render(
        <DocumentsSidePanel {...defaultProps} open={false} />
      )

      const aside = container.querySelector('aside')
      expect(aside).toHaveClass('translate-x-full')
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      const { container } = render(<DocumentsSidePanel {...defaultProps} onClose={onClose} />)

      // Find the close button (first button in the header with X icon)
      const closeButton = container.querySelector('aside button')
      expect(closeButton).toBeInTheDocument()
      fireEvent.click(closeButton!)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Document display', () => {
    it('shows document title from smart summary', () => {
      render(<DocumentsSidePanel {...defaultProps} />)

      // Smart summary generates title from filename
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    it('shows PDF icon for PDF documents', () => {
      const { container } = render(<DocumentsSidePanel {...defaultProps} />)

      // Check for red background class on PDF
      const iconContainer = container.querySelector('.bg-red-100')
      expect(iconContainer).toBeInTheDocument()
    })

    it('shows CSV icon for CSV documents', () => {
      const csvDoc = createMockDocument({
        id: 'doc-csv',
        filename: 'data.csv',
        fileType: 'csv',
        csvType: 'employees'
      })

      const { container } = render(
        <DocumentsSidePanel {...defaultProps} documents={[csvDoc]} />
      )

      // Check for primary background class (not red)
      const iconContainer = container.querySelector('.bg-primary\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('shows preview metrics in collapsed state', () => {
      render(<DocumentsSidePanel {...defaultProps} />)

      expect(screen.getByText(/Revenue:/)).toBeInTheDocument()
    })

    it('expands document on click', () => {
      render(<DocumentsSidePanel {...defaultProps} />)

      // Click the document title area to expand (now a div, not button)
      const title = screen.getByText('Test Document')
      fireEvent.click(title)

      // Should show expanded content with Net Income metric when expanded
      expect(screen.getByText('Net Income')).toBeInTheDocument()
    })
  })

  describe('Multiple documents', () => {
    it('shows all completed documents', () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'doc1.pdf' }),
        createMockDocument({ id: '2', filename: 'doc2.pdf' }),
        createMockDocument({ id: '3', filename: 'doc3.csv', fileType: 'csv' })
      ]

      render(<DocumentsSidePanel {...defaultProps} documents={documents} />)

      expect(screen.getByText('Doc1')).toBeInTheDocument()
      expect(screen.getByText('Doc2')).toBeInTheDocument()
      expect(screen.getByText('Doc3')).toBeInTheDocument()
    })

    it('separates processing documents from completed ones', () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'completed.pdf', processingStatus: 'completed' }),
        createMockDocument({ id: '2', filename: 'processing.pdf', processingStatus: 'processing' })
      ]

      render(<DocumentsSidePanel {...defaultProps} documents={documents} />)

      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('Recent Documents')).toBeInTheDocument()
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('shows empty message when no documents', () => {
      render(<DocumentsSidePanel {...defaultProps} documents={[]} />)

      expect(screen.getByText('No documents yet')).toBeInTheDocument()
      expect(screen.getByText('Drop a file in the chat to get started')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('toggles document selection when checkbox is clicked', () => {
      const onSelectionChange = vi.fn()
      render(
        <DocumentsSidePanel
          {...defaultProps}
          selectedDocumentIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      // Click the selection checkbox
      const checkbox = screen.getByRole('button', { name: /Select document/i })
      fireEvent.click(checkbox)

      expect(onSelectionChange).toHaveBeenCalledWith(['doc-1'])
    })

    it('shows selected count when documents are selected', () => {
      render(
        <DocumentsSidePanel
          {...defaultProps}
          selectedDocumentIds={['doc-1']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('1 selected for reference')).toBeInTheDocument()
    })

    it('shows dropdown menu trigger when document is expanded', () => {
      const { container } = render(
        <DocumentsSidePanel
          {...defaultProps}
          onViewData={vi.fn()}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Expand the document (click on title area, now a div)
      fireEvent.click(screen.getByText('Test Document'))

      // Dropdown menu trigger should be visible
      const menuTrigger = container.querySelector('button[aria-haspopup="menu"]')
      expect(menuTrigger).toBeInTheDocument()
    })

    // Note: Dropdown menu items are rendered via Radix portals which require
    // additional test setup. The dropdown functionality is standard Radix UI
    // behavior and is tested via E2E tests.
  })

  describe('Document metadata', () => {
    it('shows item count when available', () => {
      const docWithCount = createMockDocument({
        extractedData: {
          documentType: 'pl',
          // Use correct schema format - revenue and expenses have lineItems/categories
          revenue: {
            total: 100000,
            lineItems: Array(10).fill({ description: 'Item', amount: 10000 })
          },
          expenses: {
            total: 50000,
            categories: Array(5).fill({ description: 'Cat', amount: 10000 })
          }
        }
      })

      render(<DocumentsSidePanel {...defaultProps} documents={[docWithCount]} />)

      // Expand by clicking title area (now a div, not button)
      fireEvent.click(screen.getByText('Test Document'))

      // Item count is sum of revenue lineItems + expense categories = 15
      expect(screen.getByText(/15 items/)).toBeInTheDocument()
    })
  })
})
