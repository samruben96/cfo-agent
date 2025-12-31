'use client'

import { useState, useCallback, useRef } from 'react'

import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface DocumentDropZoneProps {
  onFileSelect: (file: File) => Promise<void>
  accept?: string
  maxSizeMB?: number
  className?: string
  disabled?: boolean
}

type DropZoneState = 'default' | 'dragover' | 'uploading' | 'success' | 'error'

export function DocumentDropZone({
  onFileSelect,
  accept = '.csv,.pdf',
  maxSizeMB = 10,
  className,
  disabled = false
}: DocumentDropZoneProps) {
  const [state, setState] = useState<DropZoneState>('default')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      // Validate file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
      if (!acceptedExtensions.includes(`.${extension}`)) {
        const friendlyTypes = acceptedExtensions.map(ext => ext.replace('.', '').toUpperCase()).join(' or ')
        return `Invalid file type. Please upload a ${friendlyTypes} file.`
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size is ${maxSizeMB}MB.`
      }

      return null
    },
    [accept, maxSizeMB]
  )

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setState('error')
        setError(validationError)
        return
      }

      setSelectedFile(file)
      setState('uploading')
      setProgress(0)
      setError(null)

      try {
        // Simulate progress (actual progress would come from upload API)
        const interval = setInterval(() => {
          setProgress((p) => Math.min(p + 10, 90))
        }, 100)

        await onFileSelect(file)

        clearInterval(interval)
        setProgress(100)
        setState('success')
      } catch (err) {
        setState('error')
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    },
    [validateFile, onFileSelect]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setState('dragover')
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState('default')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        await processFile(file)
      }
    },
    [disabled, processFile]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        await processFile(file)
      }
    },
    [processFile]
  )

  const handleReset = useCallback(() => {
    setState('default')
    setProgress(0)
    setError(null)
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled && state !== 'uploading') {
      inputRef.current?.click()
    }
  }, [disabled, state])

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        state === 'default' && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        state === 'dragover' && 'border-primary bg-primary/5',
        state === 'uploading' && 'border-primary/50 cursor-wait',
        state === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950/20',
        state === 'error' && 'border-destructive bg-destructive/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload file"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center p-8 text-center">
        {/* Icon based on state */}
        {state === 'default' && (
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        )}
        {state === 'dragover' && (
          <FileText className="h-10 w-10 text-primary mb-4" />
        )}
        {state === 'uploading' && (
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        )}
        {state === 'success' && (
          <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
        )}
        {state === 'error' && (
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        )}

        {/* Text based on state */}
        {state === 'default' && (
          <>
            <p className="text-body font-medium text-foreground mb-1">
              Drag and drop your file here
            </p>
            <p className="text-small text-muted-foreground">
              or click to browse. Supports CSV and PDF up to {maxSizeMB}MB
            </p>
          </>
        )}

        {state === 'dragover' && (
          <p className="text-body font-medium text-primary">
            Drop your file here
          </p>
        )}

        {state === 'uploading' && (
          <>
            <p className="text-body font-medium text-foreground mb-2">
              Uploading {selectedFile?.name}...
            </p>
            <Progress value={progress} className="w-48" />
          </>
        )}

        {state === 'success' && (
          <>
            <p className="text-body font-medium text-green-700 dark:text-green-400 mb-2">
              {selectedFile?.name} uploaded successfully!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
            >
              Upload another file
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <p className="text-body font-medium text-destructive mb-2">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
