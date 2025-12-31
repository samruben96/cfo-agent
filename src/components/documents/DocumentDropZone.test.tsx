/**
 * Tests for DocumentDropZone component.
 * Story: 3.3 CSV File Upload, 3.4 PDF Document Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DocumentDropZone } from './DocumentDropZone'

describe('DocumentDropZone', () => {
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnFileSelect.mockResolvedValue(undefined)
  })

  it('renders default state with instructions', () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument()
    expect(screen.getByText(/Supports CSV and PDF/)).toBeInTheDocument()
  })

  it('shows dragover state on drag enter', () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })
    fireEvent.dragOver(dropZone)

    expect(screen.getByText('Drop your file here')).toBeInTheDocument()
  })

  it('returns to default state on drag leave', () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })
    fireEvent.dragOver(dropZone)
    fireEvent.dragLeave(dropZone)

    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument()
  })

  it('validates file type and shows error for unsupported files', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    // Create an unsupported file type
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('Invalid file type. Please upload a CSV or PDF file.')).toBeInTheDocument()
    })
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('accepts PDF files by default', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('validates file size and shows error for large files', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} maxSizeMB={1} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    // Create a file larger than 1MB
    const largeContent = 'x'.repeat(2 * 1024 * 1024) // 2MB
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('File too large. Maximum size is 1MB.')).toBeInTheDocument()
    })
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('calls onFileSelect with valid CSV file', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['name,value\nTest,100'], 'test.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('shows success state after upload completes', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['name,value\nTest,100'], 'test.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.csv uploaded successfully!')).toBeInTheDocument()
    })

    // Should show upload another button
    expect(screen.getByRole('button', { name: 'Upload another file' })).toBeInTheDocument()
  })

  it('shows error state when upload fails', async () => {
    mockOnFileSelect.mockRejectedValue(new Error('Upload failed'))

    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['name,value\nTest,100'], 'test.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })

    // Should show try again button
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('resets state when "Upload another file" is clicked', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['name,value\nTest,100'], 'test.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.csv uploaded successfully!')).toBeInTheDocument()
    })

    const resetButton = screen.getByRole('button', { name: 'Upload another file' })
    await userEvent.click(resetButton)

    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} disabled />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })
    expect(dropZone).toHaveAttribute('tabIndex', '-1')
    expect(dropZone).toHaveClass('opacity-50')
  })

  it('accepts custom className', () => {
    render(
      <DocumentDropZone
        onFileSelect={mockOnFileSelect}
        className="custom-class"
      />
    )

    const dropZone = screen.getByRole('button', { name: 'Upload file' })
    expect(dropZone).toHaveClass('custom-class')
  })

  it('supports keyboard navigation', async () => {
    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    // Should be focusable
    expect(dropZone).toHaveAttribute('tabIndex', '0')

    // Focus the element
    dropZone.focus()
    expect(document.activeElement).toBe(dropZone)
  })

  it('shows progress during upload', async () => {
    // Make the onFileSelect take some time
    mockOnFileSelect.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    )

    render(<DocumentDropZone onFileSelect={mockOnFileSelect} />)

    const dropZone = screen.getByRole('button', { name: 'Upload file' })

    const file = new File(['name,value\nTest,100'], 'test.csv', { type: 'text/csv' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    // Should show uploading text
    await waitFor(() => {
      expect(screen.getByText(/Uploading/)).toBeInTheDocument()
    })

    // Progress bar should be visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
