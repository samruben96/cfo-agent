'use client'

import { Loader2, CheckCircle, AlertCircle, Upload, FileSearch, FileCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
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
  /** Compact mode for inline display (smaller icons and text) */
  compact?: boolean
  /** Additional CSS class names */
  className?: string
}

/**
 * Stage configuration for the progress indicator.
 */
const STAGES = [
  { key: 'uploading', label: 'Upload', icon: Upload },
  { key: 'processing', label: 'Process', icon: FileSearch },
  { key: 'extracting', label: 'Extract', icon: FileCheck },
  { key: 'complete', label: 'Done', icon: CheckCircle },
] as const

/**
 * Format elapsed seconds as M:SS.
 */
function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * ProcessingProgress displays a multi-step progress indicator for document processing.
 * Shows step icons, active/complete states, upload progress bar, elapsed time, and error state.
 *
 * @example
 * ```tsx
 * <ProcessingProgress
 *   stage="processing"
 *   elapsedSeconds={45}
 *   onRetry={() => handleRetry()}
 * />
 * ```
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
  // Find current stage index (-1 for error)
  const currentIndex = stage === 'error' ? -1 : STAGES.findIndex((s) => s.key === stage)

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-4', className)}>
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STAGES.map((s, index) => {
          const isActive = s.key === stage
          const isComplete = currentIndex >= 0 && index < currentIndex
          const isError = stage === 'error'
          const Icon = s.icon

          return (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'rounded-full flex items-center justify-center transition-colors',
                  compact ? 'w-7 h-7' : 'w-10 h-10',
                  isComplete && 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400',
                  isActive && !isError && 'bg-primary/10 text-primary',
                  isError && index === 0 && 'bg-destructive/10 text-destructive',
                  !isComplete && !isActive && !isError && 'bg-muted text-muted-foreground'
                )}
              >
                {isActive && stage !== 'complete' && !isError ? (
                  <Loader2 className={cn(compact ? 'h-3.5 w-3.5' : 'h-5 w-5', 'animate-spin')} />
                ) : isError && index === 0 ? (
                  <AlertCircle className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
                ) : (
                  <Icon className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
                )}
              </div>
              <span
                className={cn(
                  compact ? 'text-[10px]' : 'text-xs',
                  isActive || isComplete
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Connector lines between steps */}
      <div className={cn('flex items-center', compact ? 'px-3.5' : 'px-5')}>
        {[0, 1, 2].map((index) => {
          const isCompleted = currentIndex >= 0 && index < currentIndex
          return (
            <div
              key={index}
              className={cn(
                'flex-1 h-0.5 mx-1',
                isCompleted
                  ? 'bg-green-500 dark:bg-green-400'
                  : 'bg-muted'
              )}
            />
          )
        })}
      </div>

      {/* Upload progress bar */}
      {stage === 'uploading' && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className={compact ? 'h-1.5' : 'h-2'} />
          <p className={cn('text-muted-foreground text-center', compact ? 'text-[10px]' : 'text-xs')}>
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Processing status with elapsed time */}
      {(stage === 'processing' || stage === 'extracting') && elapsedSeconds > 0 && (
        <div className="text-center">
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {stage === 'processing' ? 'Processing' : 'Extracting'}... {formatElapsedTime(elapsedSeconds)}
          </p>
          {!compact && elapsedSeconds > 60 && (
            <p className="text-xs text-muted-foreground mt-1">
              Complex documents may take a few minutes
            </p>
          )}
        </div>
      )}

      {/* Complete state */}
      {stage === 'complete' && (
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
          <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>Complete</span>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && (
        <div className={cn('text-center', compact ? 'space-y-2' : 'space-y-3')}>
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            <span className={compact ? 'text-xs' : 'text-sm'}>{errorMessage || 'Processing failed'}</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
