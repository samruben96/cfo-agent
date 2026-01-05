/**
 * Tests for DocumentAnnouncement component
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #9, #10: AI announces document uploads with metrics and suggested questions
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentAnnouncement, formatDocumentAnnouncementMessage } from './DocumentAnnouncement'
import type { SmartSummary } from '@/lib/documents/smart-summary'

// Helper to create mock summaries
function createMockSummary(overrides: Partial<SmartSummary> = {}): SmartSummary {
  return {
    title: 'Q1 2024 Report',
    documentType: 'pl',
    metrics: [
      { label: 'Revenue', value: '$150,000', type: 'currency' },
      { label: 'Expenses', value: '$100,000', type: 'currency' }
    ],
    itemCount: 25,
    dateRange: { start: 'Jan 2024', end: 'Mar 2024' },
    confidence: 0.9,
    ...overrides
  }
}

describe('DocumentAnnouncement', () => {
  const defaultProps = {
    summary: createMockSummary(),
    suggestedQuestions: [
      'What are my biggest expenses?',
      'How does this compare to last quarter?'
    ]
  }

  describe('Document display', () => {
    it('renders document title', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText('Q1 2024 Report')).toBeInTheDocument()
    })

    it('renders document type badge', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText('P&L statement')).toBeInTheDocument()
    })

    it('shows filename when different from title', () => {
      render(
        <DocumentAnnouncement
          {...defaultProps}
          filename="financial-report-q1.pdf"
        />
      )

      expect(screen.getByText('financial-report-q1.pdf')).toBeInTheDocument()
    })

    it('hides filename when same as title', () => {
      render(
        <DocumentAnnouncement
          {...defaultProps}
          filename="Q1 2024 Report"
        />
      )

      // Should only appear once (in title, not as separate filename)
      const titleElements = screen.getAllByText('Q1 2024 Report')
      expect(titleElements).toHaveLength(1)
    })

    it('displays PDF icon for PDF files', () => {
      const { container } = render(
        <DocumentAnnouncement {...defaultProps} isPDF />
      )

      // Check for red background on icon container
      const iconContainer = container.querySelector('.bg-red-100')
      expect(iconContainer).toBeInTheDocument()
    })

    it('displays CSV icon for non-PDF files', () => {
      const { container } = render(
        <DocumentAnnouncement {...defaultProps} isPDF={false} />
      )

      // Check for primary background on icon container (not red)
      const iconContainer = container.querySelector('.bg-primary\\/10')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Metrics display', () => {
    it('renders key metrics from summary', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText('Revenue:')).toBeInTheDocument()
      expect(screen.getByText('$150,000')).toBeInTheDocument()
      expect(screen.getByText('Expenses:')).toBeInTheDocument()
      expect(screen.getByText('$100,000')).toBeInTheDocument()
    })

    it('limits metrics display to 3', () => {
      const summary = createMockSummary({
        metrics: [
          { label: 'Revenue', value: '$100', type: 'currency' },
          { label: 'Expenses', value: '$50', type: 'currency' },
          { label: 'Net', value: '$50', type: 'currency' },
          { label: 'Tax', value: '$10', type: 'currency' } // Should not show
        ]
      })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.getByText('Revenue:')).toBeInTheDocument()
      expect(screen.getByText('Expenses:')).toBeInTheDocument()
      expect(screen.getByText('Net:')).toBeInTheDocument()
      expect(screen.queryByText('Tax:')).not.toBeInTheDocument()
    })

    it('handles empty metrics gracefully', () => {
      const summary = createMockSummary({ metrics: [] })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.getByText('Q1 2024 Report')).toBeInTheDocument()
      expect(screen.getByText(/Ask me anything about it/)).toBeInTheDocument()
    })
  })

  describe('Item count and date range', () => {
    it('displays item count', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText('25 items')).toBeInTheDocument()
    })

    it('displays date range', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText('Jan 2024 - Mar 2024')).toBeInTheDocument()
    })

    it('shows single date when start equals end', () => {
      const summary = createMockSummary({
        dateRange: { start: 'Jan 2024', end: 'Jan 2024' }
      })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.getByText('Jan 2024')).toBeInTheDocument()
      expect(screen.queryByText('Jan 2024 - Jan 2024')).not.toBeInTheDocument()
    })

    it('handles missing item count', () => {
      const summary = createMockSummary({ itemCount: undefined })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.queryByText(/items/)).not.toBeInTheDocument()
    })

    it('handles missing date range', () => {
      const summary = createMockSummary({ dateRange: undefined })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.queryByText(/Jan/)).not.toBeInTheDocument()
    })
  })

  describe('Announcement message', () => {
    it('generates message with metrics', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText(/I've analyzed your P&L statement/)).toBeInTheDocument()
      expect(screen.getByText(/Revenue: \$150,000/)).toBeInTheDocument()
    })

    it('shows processing message when isProcessing is true', () => {
      render(<DocumentAnnouncement {...defaultProps} isProcessing />)

      // Updated to use the helpful message that lets users know they can start asking questions
      expect(screen.getByText(/still processing your document/)).toBeInTheDocument()
      expect(screen.getByText(/you can start asking questions/)).toBeInTheDocument()
    })

    it('includes item count in message', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByText(/with 25 items/)).toBeInTheDocument()
    })
  })

  describe('Suggested questions', () => {
    it('renders suggested questions as buttons', () => {
      render(<DocumentAnnouncement {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'What are my biggest expenses?' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'How does this compare to last quarter?' })).toBeInTheDocument()
    })

    it('calls onQuestionClick when question is clicked', () => {
      const onQuestionClick = vi.fn()
      render(
        <DocumentAnnouncement
          {...defaultProps}
          onQuestionClick={onQuestionClick}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'What are my biggest expenses?' }))

      expect(onQuestionClick).toHaveBeenCalledWith('What are my biggest expenses?')
    })

    it('shows generic questions when processing', () => {
      // When processing, we show helpful generic questions to let users interact early
      const processingQuestions = [
        'What is this document about?',
        'What should I expect from this data?'
      ]
      render(
        <DocumentAnnouncement
          {...defaultProps}
          suggestedQuestions={processingQuestions}
          isProcessing
        />
      )

      expect(screen.getByRole('button', { name: 'What is this document about?' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'What should I expect from this data?' })).toBeInTheDocument()
    })

    it('handles empty questions array', () => {
      render(
        <DocumentAnnouncement
          {...defaultProps}
          suggestedQuestions={[]}
        />
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Document types', () => {
    it.each([
      ['pl', 'P&L statement'],
      ['payroll', 'payroll report'],
      ['expense', 'expense report'],
      ['employees', 'employee data'],
      ['csv', 'data file'],
      ['pdf', 'document'],
      ['unknown', 'document']
    ] as const)('displays correct label for %s document type', (type, expectedLabel) => {
      const summary = createMockSummary({ documentType: type })

      render(<DocumentAnnouncement {...defaultProps} summary={summary} />)

      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    })
  })
})

describe('formatDocumentAnnouncementMessage', () => {
  it('generates message with metrics and questions', () => {
    const summary = createMockSummary()
    const questions = ['Question 1?', 'Question 2?']

    const message = formatDocumentAnnouncementMessage(summary, questions)

    expect(message).toContain('P&L statement')
    expect(message).toContain('Revenue: $150,000')
    expect(message).toContain('Ask me anything about it!')
    expect(message).toContain('Suggested questions:')
    expect(message).toContain('- Question 1?')
    expect(message).toContain('- Question 2?')
  })

  it('handles empty questions', () => {
    const summary = createMockSummary()

    const message = formatDocumentAnnouncementMessage(summary, [])

    expect(message).not.toContain('Suggested questions')
  })

  it('handles empty metrics', () => {
    const summary = createMockSummary({ metrics: [] })

    const message = formatDocumentAnnouncementMessage(summary, [])

    expect(message).toContain('Ask me anything about it!')
  })
})
