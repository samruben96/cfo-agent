/**
 * Tests for ChatInput component with drag-drop and attachment button
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #1, #2: Drag-drop and attachment button in chat
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ChatInput, type FileProcessingState } from './ChatInput'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('ChatInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('renders textarea with placeholder', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByPlaceholderText('Ask your CFO anything...')).toBeInTheDocument()
    })

    it('renders send button with accessible label', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    })

    it('calls onChange when typing in textarea', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} onChange={onChange} />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      await user.type(textarea, 'test')

      expect(onChange).toHaveBeenCalled()
    })

    it('calls onSubmit when form is submitted via button click', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

      const button = screen.getByRole('button', { name: 'Send message' })
      await user.click(button)

      expect(onSubmit).toHaveBeenCalled()
    })

    it('submits on Enter key press', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

      expect(onSubmit).toHaveBeenCalled()
    })

    it('does not submit on Shift+Enter', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      render(<ChatInput {...defaultProps} value="test message" onSubmit={onSubmit} />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('does not submit when value is empty', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      render(<ChatInput {...defaultProps} value="" onSubmit={onSubmit} />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('does not submit when value is only whitespace', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      render(<ChatInput {...defaultProps} value="   " onSubmit={onSubmit} />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('disables textarea when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled />)

      const textarea = screen.getByPlaceholderText('Ask your CFO anything...')
      expect(textarea).toBeDisabled()
    })

    it('disables button when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled />)

      const button = screen.getByRole('button', { name: 'Send message' })
      expect(button).toBeDisabled()
    })

    it('disables button when value is empty', () => {
      render(<ChatInput {...defaultProps} value="" />)

      const button = screen.getByRole('button', { name: 'Send message' })
      expect(button).toBeDisabled()
    })

    it('enables button when value has content', () => {
      render(<ChatInput {...defaultProps} value="test" />)

      const button = screen.getByRole('button', { name: 'Send message' })
      expect(button).not.toBeDisabled()
    })

    it('accepts and applies custom className', () => {
      const { container } = render(<ChatInput {...defaultProps} className="custom-class" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('Attachment button', () => {
    it('shows attachment button when onFileSelect is provided', () => {
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument()
    })

    it('hides attachment button when onFileSelect is not provided', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.queryByRole('button', { name: 'Attach file' })).not.toBeInTheDocument()
    })

    it('disables attachment button when disabled prop is true', () => {
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} disabled />)

      expect(screen.getByRole('button', { name: 'Attach file' })).toBeDisabled()
    })

    it('disables attachment button during upload', () => {
      const onFileSelect = vi.fn()
      const processingFile: FileProcessingState = {
        file: new File([''], 'test.csv', { type: 'text/csv' }),
        status: 'uploading'
      }
      render(
        <ChatInput
          {...defaultProps}
          onFileSelect={onFileSelect}
          processingFile={processingFile}
        />
      )

      expect(screen.getByRole('button', { name: 'Attach file' })).toBeDisabled()
    })
  })

  describe('File validation', () => {
    it('accepts CSV files', async () => {
      const onFileSelect = vi.fn().mockResolvedValue(undefined)
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await waitFor(() => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      expect(onFileSelect).toHaveBeenCalledWith(file)
    })

    it('accepts PDF files', async () => {
      const onFileSelect = vi.fn().mockResolvedValue(undefined)
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await waitFor(() => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      expect(onFileSelect).toHaveBeenCalledWith(file)
    })

    it('rejects unsupported file types', async () => {
      const { toast } = await import('sonner')
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await waitFor(() => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      expect(onFileSelect).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Only CSV and PDF files are supported')
    })

    it('rejects files over 10MB', async () => {
      const { toast } = await import('sonner')
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      // Create a mock file that claims to be >10MB
      const file = new File([''], 'large.csv', { type: 'text/csv' })
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await waitFor(() => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      expect(onFileSelect).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('File too large. Maximum size is 10MB')
    })
  })

  describe('Drag and drop', () => {
    it('shows drag overlay when dragging over', () => {
      const onFileSelect = vi.fn()
      const { container } = render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      fireEvent.dragEnter(container.firstChild!, {
        dataTransfer: { items: [{ kind: 'file' }] }
      })

      expect(screen.getByText('Drop your file here')).toBeInTheDocument()
    })

    it('hides drag overlay when drag leaves', () => {
      const onFileSelect = vi.fn()
      const { container } = render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      fireEvent.dragEnter(container.firstChild!, {
        dataTransfer: { items: [{ kind: 'file' }] }
      })
      fireEvent.dragLeave(container.firstChild!, {})

      expect(screen.queryByText('Drop your file here')).not.toBeInTheDocument()
    })

    it('processes file on drop', async () => {
      const onFileSelect = vi.fn().mockResolvedValue(undefined)
      const { container } = render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })

      fireEvent.drop(container.firstChild!, {
        dataTransfer: { files: [file] }
      })

      await waitFor(() => {
        expect(onFileSelect).toHaveBeenCalledWith(file)
      })
    })

    it('changes placeholder text when dragging', () => {
      const onFileSelect = vi.fn()
      const { container } = render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      fireEvent.dragEnter(container.firstChild!, {
        dataTransfer: { items: [{ kind: 'file' }] }
      })

      expect(screen.getByPlaceholderText('Drop file here...')).toBeInTheDocument()
    })
  })

  describe('File processing indicator', () => {
    it('shows processing indicator when file is uploading', () => {
      const processingFile: FileProcessingState = {
        file: new File([''], 'test.csv', { type: 'text/csv' }),
        status: 'uploading'
      }

      render(
        <ChatInput
          {...defaultProps}
          onFileSelect={vi.fn()}
          processingFile={processingFile}
        />
      )

      expect(screen.getByText('test.csv')).toBeInTheDocument()
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('shows processing indicator when file is processing', () => {
      const processingFile: FileProcessingState = {
        file: new File([''], 'report.pdf', { type: 'application/pdf' }),
        status: 'processing'
      }

      render(
        <ChatInput
          {...defaultProps}
          onFileSelect={vi.fn()}
          processingFile={processingFile}
        />
      )

      expect(screen.getByText('report.pdf')).toBeInTheDocument()
      expect(screen.getByText('Processing document...')).toBeInTheDocument()
    })

    it('shows error state when processing fails', () => {
      const processingFile: FileProcessingState = {
        file: new File([''], 'bad.csv', { type: 'text/csv' }),
        status: 'error',
        error: 'Invalid format'
      }

      render(
        <ChatInput
          {...defaultProps}
          onFileSelect={vi.fn()}
          processingFile={processingFile}
        />
      )

      expect(screen.getByText('bad.csv')).toBeInTheDocument()
      expect(screen.getByText('Invalid format')).toBeInTheDocument()
    })

    it('shows PDF icon styling for PDF files', () => {
      const processingFile: FileProcessingState = {
        file: new File([''], 'report.pdf', { type: 'application/pdf' }),
        status: 'processing'
      }

      render(
        <ChatInput
          {...defaultProps}
          onFileSelect={vi.fn()}
          processingFile={processingFile}
        />
      )

      // Check for the red PDF styling class on the icon container
      const iconContainer = screen.getByText('report.pdf').closest('div')?.previousElementSibling
      expect(iconContainer).toHaveClass('bg-red-100')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria labels', () => {
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} onFileSelect={onFileSelect} />)

      expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    })

    it('hides file input from accessibility tree', () => {
      render(<ChatInput {...defaultProps} onFileSelect={vi.fn()} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
