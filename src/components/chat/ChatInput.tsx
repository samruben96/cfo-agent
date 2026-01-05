'use client'

import { FormEvent, KeyboardEvent, useState, useCallback, useRef, DragEvent } from 'react'

import { Send, Paperclip, X, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * Processing state for file uploads in chat
 */
export interface FileProcessingState {
  file: File
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  documentId?: string
}

/** Document reference for display in chat input */
export interface SelectedDocumentInfo {
  id: string
  filename: string
  title: string
  fileType: 'csv' | 'pdf'
}

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  className?: string
  /** Callback when a file is selected for upload */
  onFileSelect?: (file: File) => Promise<void>
  /** Current file processing state (controlled) */
  processingFile?: FileProcessingState | null
  /** Selected documents to reference in chat */
  selectedDocuments?: SelectedDocumentInfo[]
  /** Callback to remove a selected document */
  onRemoveDocument?: (documentId: string) => void
}

/**
 * Validate file for upload
 */
function validateFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const acceptedExtensions = ['csv', 'pdf']
  if (!extension || !acceptedExtensions.includes(extension)) {
    return 'Only CSV and PDF files are supported'
  }
  const maxSizeMB = 10
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File too large. Maximum size is ${maxSizeMB}MB`
  }
  return null
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  className,
  onFileSelect,
  processingFile,
  selectedDocuments = [],
  onRemoveDocument
}: ChatInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form && value.trim()) {
        form.requestSubmit()
      }
    }
  }

  const handleFileProcess = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    if (!onFileSelect) {
      toast.error('File upload is not available')
      return
    }

    setSelectedFile(file)
    setIsUploading(true)

    try {
      await onFileSelect(file)
      // File successfully started processing, clear the local selected file
      // The processingFile prop will show the processing state
      setSelectedFile(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setSelectedFile(null)
    } finally {
      setIsUploading(false)
    }
  }, [onFileSelect])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleFileProcess(file)
    }
  }, [handleFileProcess])

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileProcess(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileProcess])

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCancelFile = useCallback(() => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const isPDF = (file: File) => file.name.toLowerCase().endsWith('.pdf')
  const showFileProcessing = isUploading || processingFile

  return (
    <div
      className={cn(
        'border-t bg-background p-md transition-colors',
        isDragging && 'bg-primary/5 border-t-primary',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="max-w-chat mx-auto mb-sm">
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-primary bg-primary/5 text-primary">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Drop your file here</span>
          </div>
        </div>
      )}

      {/* Selected documents chips */}
      {selectedDocuments.length > 0 && (
        <div className="max-w-chat mx-auto mb-sm">
          <div className="flex flex-wrap gap-2">
            {selectedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 py-1 pl-2 pr-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                {doc.fileType === 'pdf' ? (
                  <FileText className="h-3 w-3" />
                ) : (
                  <FileSpreadsheet className="h-3 w-3" />
                )}
                <span className="max-w-[120px] truncate">{doc.title}</span>
                {onRemoveDocument && (
                  <button
                    type="button"
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    aria-label={`Remove ${doc.title}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File processing indicator */}
      {showFileProcessing && (
        <div className="max-w-chat mx-auto mb-sm">
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted">
            {/* File icon */}
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center',
              processingFile?.file && isPDF(processingFile.file)
                ? 'bg-red-100 dark:bg-red-950/30'
                : selectedFile && isPDF(selectedFile)
                  ? 'bg-red-100 dark:bg-red-950/30'
                  : 'bg-muted-foreground/10'
            )}>
              {(processingFile?.file && isPDF(processingFile.file)) || (selectedFile && isPDF(selectedFile)) ? (
                <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {processingFile?.file?.name || selectedFile?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {processingFile?.status === 'uploading' && 'Uploading...'}
                {processingFile?.status === 'processing' && 'Processing document...'}
                {processingFile?.status === 'complete' && 'Ready'}
                {processingFile?.status === 'error' && (processingFile.error || 'Error')}
                {isUploading && !processingFile && 'Uploading...'}
                {!isUploading && !processingFile && selectedFile && formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Status/actions */}
            {(isUploading || processingFile?.status === 'uploading' || processingFile?.status === 'processing') && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {!isUploading && !processingFile && selectedFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCancelFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="max-w-chat mx-auto">
        <div className="flex gap-sm items-end">
          {/* Attachment button */}
          {onFileSelect && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              disabled={disabled || isUploading || !!processingFile}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}

          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={isDragging ? 'Drop file here...' : 'Ask your CFO anything...'}
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            size="icon"
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
