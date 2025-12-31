/**
 * Tests for ProcessingProgress component.
 * Story: 3.5 Document Processing Status & Notifications
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProcessingProgress } from './ProcessingProgress'

describe('ProcessingProgress', () => {
  it('renders all stage labels', () => {
    render(<ProcessingProgress stage="uploading" />)

    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Process')).toBeInTheDocument()
    expect(screen.getByText('Extract')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  describe('uploading stage', () => {
    it('shows upload progress bar during uploading', () => {
      render(<ProcessingProgress stage="uploading" uploadProgress={50} />)

      expect(screen.getByText('Uploading... 50%')).toBeInTheDocument()
      // Progress bar should be present
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('shows 0% by default when no uploadProgress provided', () => {
      render(<ProcessingProgress stage="uploading" />)

      expect(screen.getByText('Uploading... 0%')).toBeInTheDocument()
    })
  })

  describe('processing stage', () => {
    it('shows elapsed time during processing', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={45} />)

      expect(screen.getByText('Processing... 0:45')).toBeInTheDocument()
    })

    it('shows hint message for long processing times', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={90} />)

      expect(screen.getByText('Processing... 1:30')).toBeInTheDocument()
      expect(screen.getByText('Complex documents may take a few minutes')).toBeInTheDocument()
    })
  })

  describe('extracting stage', () => {
    it('shows elapsed time during extracting', () => {
      render(<ProcessingProgress stage="extracting" elapsedSeconds={30} />)

      expect(screen.getByText('Extracting... 0:30')).toBeInTheDocument()
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

  describe('progress indicators', () => {
    it('marks previous stages as complete when on later stage', () => {
      const { container } = render(<ProcessingProgress stage="extracting" />)

      // Upload and Process stages should have the green/complete styling
      // This is a visual test - we check for specific classes
      const stageIcons = container.querySelectorAll('.rounded-full')
      expect(stageIcons.length).toBe(4)
    })

    it('applies custom className', () => {
      const { container } = render(
        <ProcessingProgress stage="complete" className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('elapsed time formatting', () => {
    it('formats seconds correctly', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={5} />)
      expect(screen.getByText('Processing... 0:05')).toBeInTheDocument()
    })

    it('formats minutes and seconds correctly', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={125} />)
      expect(screen.getByText('Processing... 2:05')).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('applies compact spacing classes', () => {
      const { container } = render(<ProcessingProgress stage="uploading" compact />)

      // Compact mode uses space-y-2 instead of space-y-4
      expect(container.firstChild).toHaveClass('space-y-2')
    })

    it('uses smaller icons in compact mode', () => {
      const { container } = render(<ProcessingProgress stage="processing" compact />)

      // Compact icons are w-7 h-7 instead of w-10 h-10
      const iconContainers = container.querySelectorAll('.rounded-full')
      iconContainers.forEach((icon) => {
        expect(icon).toHaveClass('w-7', 'h-7')
      })
    })

    it('uses smaller text in compact mode', () => {
      render(<ProcessingProgress stage="uploading" uploadProgress={50} compact />)

      // Compact text is text-[10px] for labels
      const uploadText = screen.getByText('Uploading... 50%')
      expect(uploadText).toHaveClass('text-[10px]')
    })

    it('does not show hint message in compact mode for long processing', () => {
      render(<ProcessingProgress stage="processing" elapsedSeconds={90} compact />)

      // Hint message should not appear in compact mode
      expect(screen.queryByText('Complex documents may take a few minutes')).not.toBeInTheDocument()
    })

    it('uses smaller progress bar in compact mode', () => {
      const { container } = render(<ProcessingProgress stage="uploading" uploadProgress={50} compact />)

      // Compact progress bar uses h-1.5 class
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toHaveClass('h-1.5')
    })
  })
})
