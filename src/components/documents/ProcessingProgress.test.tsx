/**
 * Tests for ProcessingProgress component.
 * Story: 3.5 Document Processing Status & Notifications
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProcessingProgress } from './ProcessingProgress'

describe('ProcessingProgress', () => {
  describe('idle stage', () => {
    it('renders nothing when idle', () => {
      const { container } = render(<ProcessingProgress stage="idle" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('uploading stage', () => {
    it('shows uploading message', () => {
      render(<ProcessingProgress stage="uploading" />)
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('shows upload progress percentage when provided', () => {
      render(<ProcessingProgress stage="uploading" uploadProgress={50} />)
      expect(screen.getByText('Uploading... 50%')).toBeInTheDocument()
    })
  })

  describe('processing stage', () => {
    it('shows analyzing message', () => {
      render(<ProcessingProgress stage="processing" />)
      expect(screen.getByText('Analyzing document...')).toBeInTheDocument()
    })

    it('shows elapsed time when > 3 seconds', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={10} />)
      expect(screen.getByText('10s elapsed')).toBeInTheDocument()
    })

    it('does not show elapsed time when <= 3 seconds', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={3} />)
      expect(screen.queryByText(/elapsed/)).not.toBeInTheDocument()
    })
  })

  describe('extracting stage', () => {
    it('shows extracting message', () => {
      render(<ProcessingProgress stage="extracting" />)
      expect(screen.getByText('Extracting data...')).toBeInTheDocument()
    })

    it('shows elapsed time when > 3 seconds', () => {
      render(<ProcessingProgress stage="extracting" elapsedSeconds={15} />)
      expect(screen.getByText('15s elapsed')).toBeInTheDocument()
    })
  })

  describe('complete stage', () => {
    it('shows completion message', () => {
      render(<ProcessingProgress stage="complete" />)
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  describe('error stage', () => {
    it('shows default error message when none provided', () => {
      render(<ProcessingProgress stage="error" />)
      expect(screen.getByText('Processing failed')).toBeInTheDocument()
    })

    it('shows custom error message', () => {
      render(<ProcessingProgress stage="error" errorMessage="File format not supported" />)
      expect(screen.getByText('File format not supported')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(<ProcessingProgress stage="error" onRetry={onRetry} />)
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('does not show retry button when onRetry is not provided', () => {
      render(<ProcessingProgress stage="error" />)
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<ProcessingProgress stage="error" onRetry={onRetry} />)

      await user.click(screen.getByRole('button', { name: 'Retry' }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ProcessingProgress stage="complete" className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('applies compact spacing in compact mode', () => {
      const { container } = render(<ProcessingProgress stage="processing" compact />)
      expect(container.firstChild).toHaveClass('py-2')
    })

    it('applies normal spacing by default', () => {
      const { container } = render(<ProcessingProgress stage="processing" />)
      expect(container.firstChild).toHaveClass('py-4')
    })
  })

  describe('pulsing dots', () => {
    it('shows pulsing dots during uploading', () => {
      const { container } = render(<ProcessingProgress stage="uploading" />)
      const dots = container.querySelectorAll('.animate-pulse')
      expect(dots.length).toBe(3)
    })

    it('shows pulsing dots during processing', () => {
      const { container } = render(<ProcessingProgress stage="processing" />)
      const dots = container.querySelectorAll('.animate-pulse')
      expect(dots.length).toBe(3)
    })

    it('does not show pulsing dots when complete', () => {
      const { container } = render(<ProcessingProgress stage="complete" />)
      const dots = container.querySelectorAll('.animate-pulse')
      expect(dots.length).toBe(0)
    })

    it('does not show pulsing dots on error', () => {
      const { container } = render(<ProcessingProgress stage="error" />)
      const dots = container.querySelectorAll('.animate-pulse')
      expect(dots.length).toBe(0)
    })
  })
})
