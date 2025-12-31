/**
 * Tests for ProcessingErrorHelp component.
 * Story: 3.5 Document Processing Status & Notifications
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProcessingErrorHelp, categorizeError } from './ProcessingErrorHelp'

describe('ProcessingErrorHelp', () => {
  describe('categorizeError', () => {
    it('categorizes network errors', () => {
      expect(categorizeError('Network connection failed')).toBe('network')
      expect(categorizeError('Failed to fetch')).toBe('network')
      expect(categorizeError('Offline mode')).toBe('network')
    })

    it('categorizes format errors', () => {
      expect(categorizeError('Unsupported file format')).toBe('format')
      expect(categorizeError('Invalid file type')).toBe('format')
      expect(categorizeError('Cannot read corrupt file')).toBe('format')
    })

    it('categorizes timeout errors', () => {
      expect(categorizeError('Request timed out')).toBe('timeout')
      expect(categorizeError('Processing took too long')).toBe('timeout')
      expect(categorizeError('Rate limit exceeded')).toBe('timeout')
      expect(categorizeError('Document too complex for processing')).toBe('timeout')
      expect(categorizeError('TIMEOUT: Vision API processing')).toBe('timeout')
    })

    it('categorizes extraction errors', () => {
      expect(categorizeError('Could not extract data')).toBe('extraction')
      expect(categorizeError('Failed to parse document')).toBe('extraction')
      expect(categorizeError('No data found in file')).toBe('extraction')
    })

    it('returns unknown for unrecognized errors', () => {
      expect(categorizeError('Something went wrong')).toBe('unknown')
      expect(categorizeError(undefined)).toBe('unknown')
    })
  })

  describe('component rendering', () => {
    it('renders error message', () => {
      render(<ProcessingErrorHelp errorMessage="Test error message" />)

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('shows network error suggestions', () => {
      render(<ProcessingErrorHelp errorMessage="Network connection failed" />)

      expect(screen.getByText('Connection issue')).toBeInTheDocument()
      expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('shows format error suggestions', () => {
      render(<ProcessingErrorHelp errorMessage="Unsupported file format" />)

      expect(screen.getByText('File format issue')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Upload different file' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enter data manually' })).toBeInTheDocument()
    })

    it('shows timeout error suggestions', () => {
      render(<ProcessingErrorHelp errorMessage="Request timed out" />)

      expect(screen.getByText('Document too complex')).toBeInTheDocument()
      expect(screen.getByText(/export your data as a CSV file/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Upload CSV instead' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enter data manually' })).toBeInTheDocument()
    })

    it('shows extraction error suggestions', () => {
      render(<ProcessingErrorHelp errorMessage="Could not extract data" />)

      // Title is "Could not extract data" - check by role
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Could not extract data')
      expect(screen.getByRole('button', { name: 'Enter data manually' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Contact support' })).toBeInTheDocument()
    })

    it('shows unknown error suggestions', () => {
      render(<ProcessingErrorHelp errorMessage="Something unexpected happened" />)

      expect(screen.getByText('Processing failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Contact support' })).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(<ProcessingErrorHelp errorMessage="Network error" onRetry={onRetry} />)

      await user.click(screen.getByRole('button', { name: 'Retry' }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('calls onManualEntry when manual entry button is clicked', async () => {
      const user = userEvent.setup()
      const onManualEntry = vi.fn()

      render(<ProcessingErrorHelp errorMessage="Unsupported format" onManualEntry={onManualEntry} />)

      await user.click(screen.getByRole('button', { name: 'Enter data manually' }))

      expect(onManualEntry).toHaveBeenCalledTimes(1)
    })

    it('opens support email when contact support is clicked', async () => {
      const user = userEvent.setup()
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      render(<ProcessingErrorHelp errorMessage="Unknown error" />)

      await user.click(screen.getByRole('button', { name: 'Contact support' }))

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support'),
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ProcessingErrorHelp errorMessage="Error" className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
