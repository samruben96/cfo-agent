'use client'

import { Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Processing stages for document upload and extraction.
 */
export type ProcessingStage = 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'

interface ProcessingProgressProps {
  /** Current processing stage */
  stage: ProcessingStage
  /** Upload progress percentage (0-100), shown during 'uploading' stage */
  uploadProgress?: number
  /** Elapsed time in seconds since processing started */
  elapsedSeconds?: number
  /** Error message to display when stage is 'error' */
  errorMessage?: string
  /** Callback when user clicks retry button */
  onRetry?: () => void
  /** Compact mode for inline display */
  compact?: boolean
  /** Additional CSS class names */
  className?: string
}

/**
 * Get stage message for display.
 */
function getStageMessage(stage: ProcessingStage): string {
  switch (stage) {
    case 'uploading':
      return 'Uploading...'
    case 'processing':
      return 'Analyzing document...'
    case 'extracting':
      return 'Extracting data...'
    case 'complete':
      return 'Complete'
    case 'error':
      return 'Processing failed'
    default:
      return ''
  }
}

/**
 * ProcessingProgress displays a simple, clear processing indicator.
 * Shows a pulsing animation during processing without fake progress bars.
 */
export function ProcessingProgress({
  stage,
  uploadProgress = 0,
  elapsedSeconds = 0,
  errorMessage,
  onRetry,
  compact = false,
  className,
}: ProcessingProgressProps) {
  if (stage === 'idle') return null

  return (
    <div className={cn(
      'flex items-center gap-3',
      compact ? 'py-2' : 'py-4',
      className
    )}>
      {/* Icon with animation */}
      <div className={cn(
        'flex items-center justify-center rounded-full',
        compact ? 'w-8 h-8' : 'w-10 h-10',
        stage === 'complete' && 'bg-green-100 dark:bg-green-950/30',
        stage === 'error' && 'bg-destructive/10',
        (stage === 'uploading' || stage === 'processing' || stage === 'extracting') && 'bg-primary/10'
      )}>
        {stage === 'complete' ? (
          <CheckCircle className={cn(
            'text-green-600 dark:text-green-400',
            compact ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        ) : stage === 'error' ? (
          <AlertCircle className={cn(
            'text-destructive',
            compact ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        ) : (
          <div className="relative">
            <FileText className={cn(
              'text-primary/50',
              compact ? 'h-4 w-4' : 'h-5 w-5'
            )} />
            <Loader2 className={cn(
              'absolute inset-0 text-primary animate-spin',
              compact ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          compact ? 'text-sm' : 'text-base',
          stage === 'complete' && 'text-green-600 dark:text-green-400',
          stage === 'error' && 'text-destructive'
        )}>
          {getStageMessage(stage)}
          {stage === 'uploading' && uploadProgress > 0 && ` ${uploadProgress}%`}
        </p>

        {/* Elapsed time for long operations */}
        {(stage === 'processing' || stage === 'extracting') && elapsedSeconds > 3 && (
          <p className={cn(
            'text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {elapsedSeconds}s elapsed
          </p>
        )}

        {/* Error message */}
        {stage === 'error' && errorMessage && (
          <p className={cn(
            'text-muted-foreground truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {errorMessage}
          </p>
        )}
      </div>

      {/* Retry button for errors */}
      {stage === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}

      {/* Pulsing dot animation for active states */}
      {(stage === 'uploading' || stage === 'processing' || stage === 'extracting') && (
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
