'use client'

import { useState, useMemo } from 'react'

import {
  FileText,
  FileSpreadsheet,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProcessingProgress, type ProcessingStage } from './ProcessingProgress'
import { ProcessingErrorHelp } from './ProcessingErrorHelp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { getCSVTypeLabel } from '@/lib/documents/csv-type-detector'
import { generateSmartSummary } from '@/lib/documents/smart-summary'

import type { Document, ProcessingStatus } from '@/types/documents'
import { getPDFSchemaType, getPDFSchemaLabel } from '@/types/documents'

interface DocumentCardProps {
  document: Document
  onDelete: (documentId: string) => Promise<void>
  onView?: (document: Document) => void
  onDownload?: (document: Document) => Promise<void>
  onRetry?: (document: Document) => void
  /** Callback for "Chat to resolve" error action - AC #17, #18 */
  onChatToResolve?: (document: Document) => void
  /** Callback for manual data entry action from error help */
  onManualEntry?: () => void
  /** Processing stage for multi-step indicator (optional, for active processing) */
  processingStage?: ProcessingStage
  /** Elapsed seconds for processing progress (optional, for active uploads) */
  elapsedSeconds?: number
  className?: string
}

const STATUS_CONFIG: Record<ProcessingStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: typeof Clock
}> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: Clock
  },
  processing: {
    label: 'Processing',
    variant: 'default',
    icon: Loader2
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    icon: CheckCircle
  },
  error: {
    label: 'Error',
    variant: 'destructive',
    icon: AlertCircle
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function DocumentCard({
  document,
  onDelete,
  onView,
  onDownload,
  onRetry,
  onChatToResolve,
  onManualEntry,
  processingStage,
  elapsedSeconds,
  className
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isProcessing = document.processingStatus === 'processing'
  const isCompleted = document.processingStatus === 'completed'
  // Determine stage: use provided stage or default to 'processing' for documents in processing status
  const effectiveStage: ProcessingStage = processingStage || (isProcessing ? 'processing' : 'idle')

  // Generate smart summary for completed documents - AC #14
  const smartSummary = useMemo(() => {
    if (!isCompleted) return null
    return generateSmartSummary(document)
  }, [document, isCompleted])

  const statusConfig = STATUS_CONFIG[document.processingStatus]
  const StatusIcon = statusConfig.icon
  const csvTypeLabel = document.csvType ? getCSVTypeLabel(document.csvType) : null
  const isPDF = document.fileType === 'pdf'
  const FileIcon = isPDF ? FileText : FileSpreadsheet

  // Get PDF schema label from centralized helper
  const pdfSchemaType = isPDF ? getPDFSchemaType(document.extractedData) : null
  const pdfSchemaLabel = getPDFSchemaLabel(pdfSchemaType)

  // Preview metrics (top 2) for collapsed view
  const previewMetrics = smartSummary?.metrics.slice(0, 2) ?? []

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(document.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDownload = async () => {
    if (!onDownload) return
    setIsDownloading(true)
    try {
      await onDownload(document)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File icon */}
          <div className="flex-shrink-0">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isPDF ? 'bg-red-100 dark:bg-red-950/30' : 'bg-primary/10'
            )}>
              <FileIcon className={cn(
                'h-5 w-5',
                isPDF ? 'text-red-600 dark:text-red-400' : 'text-primary'
              )} />
            </div>
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Smart summary title or filename - AC #14 */}
                <h3 className="font-medium text-foreground truncate">
                  {smartSummary?.title || document.filename}
                </h3>
                {/* Preview metrics in collapsed state - AC #19 */}
                {isCompleted && !isExpanded && previewMetrics.length > 0 ? (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {previewMetrics.map(m => `${m.label}: ${m.value}`).join(' • ')}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                  </p>
                )}
              </div>

              {/* Status badge - only show for non-completed */}
              {!isCompleted && (
                <Badge variant={statusConfig.variant} className="flex-shrink-0 gap-1">
                  <StatusIcon
                    className={cn(
                      'h-3 w-3',
                      document.processingStatus === 'processing' && 'animate-spin'
                    )}
                  />
                  {statusConfig.label}
                </Badge>
              )}
            </div>

            {/* Processing progress indicator - multi-step view */}
            {isProcessing && effectiveStage !== 'idle' && effectiveStage !== 'complete' && (
              <div className="mt-3">
                <ProcessingProgress
                  stage={effectiveStage}
                  elapsedSeconds={elapsedSeconds}
                  compact
                />
              </div>
            )}

            {/* Expanded details - Level 2 & 3 progressive disclosure - AC #20, #21 */}
            {isCompleted && isExpanded && smartSummary && (
              <div className="mt-3 space-y-3">
                {/* Full metrics list */}
                {smartSummary.metrics.length > 0 && (
                  <div className="space-y-1.5">
                    {smartSummary.metrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-medium text-foreground">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {smartSummary.itemCount && <span>{smartSummary.itemCount} items</span>}
                  {smartSummary.dateRange && (
                    <>
                      {smartSummary.itemCount && <span>•</span>}
                      <span>
                        {smartSummary.dateRange.start === smartSummary.dateRange.end
                          ? smartSummary.dateRange.start
                          : `${smartSummary.dateRange.start} - ${smartSummary.dateRange.end}`}
                      </span>
                    </>
                  )}
                  {/* Confidence indicator - AC #8 */}
                  <span>•</span>
                  <span className={cn(
                    smartSummary.confidence >= 0.8 ? 'text-green-600 dark:text-green-400' :
                    smartSummary.confidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-orange-600 dark:text-orange-400'
                  )}>
                    {smartSummary.confidence >= 0.8 ? 'High' :
                     smartSummary.confidence >= 0.6 ? 'Medium' : 'Low'} confidence
                  </span>
                  {/* File info when expanded */}
                  <span>•</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(document.createdAt)}</span>
                </div>

                {/* Document type label */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {!isPDF && csvTypeLabel && (
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">
                      {csvTypeLabel}
                    </span>
                  )}
                  {isPDF && pdfSchemaLabel && (
                    <span className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-xs">
                      {pdfSchemaLabel}
                    </span>
                  )}
                  {!isPDF && document.rowCount && (
                    <span className="text-xs">{document.rowCount} rows</span>
                  )}
                </div>
              </div>
            )}

            {/* Error help with contextual suggestions - AC #17, #18 */}
            {document.processingStatus === 'error' && (
              <div className="mt-3">
                <ProcessingErrorHelp
                  errorMessage={document.errorMessage}
                  onRetry={onRetry ? () => onRetry(document) : undefined}
                  onManualEntry={onManualEntry}
                  onChatToResolve={onChatToResolve ? () => onChatToResolve(document) : undefined}
                  className="border-0 shadow-none p-0"
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {/* View Data - primary action on documents page */}
              {isCompleted && onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(document)}
                >
                  View Data
                </Button>
              )}

              {/* Expand/collapse toggle for progressive disclosure - AC #16 */}
              {isCompleted && smartSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-auto"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      More
                    </>
                  )}
                </Button>
              )}

              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="sr-only">Download</span>
                </Button>
              )}

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{document.filename}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
