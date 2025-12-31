'use client'

import { useState } from 'react'

import { FileText, FileSpreadsheet, Trash2, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

import type { Document, ProcessingStatus } from '@/types/documents'
import { getPDFSchemaType, getPDFSchemaLabel } from '@/types/documents'

interface DocumentCardProps {
  document: Document
  onDelete: (documentId: string) => Promise<void>
  onView?: (document: Document) => void
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
  className
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const statusConfig = STATUS_CONFIG[document.processingStatus]
  const StatusIcon = statusConfig.icon
  const csvTypeLabel = document.csvType ? getCSVTypeLabel(document.csvType) : null
  const isPDF = document.fileType === 'pdf'
  const FileIcon = isPDF ? FileText : FileSpreadsheet

  // Get PDF schema label from centralized helper
  const pdfSchemaType = isPDF ? getPDFSchemaType(document.extractedData) : null
  const pdfSchemaLabel = getPDFSchemaLabel(pdfSchemaType)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(document.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
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
              isPDF ? 'bg-red-100 dark:bg-red-950/30' : 'bg-muted'
            )}>
              <FileIcon className={cn(
                'h-5 w-5',
                isPDF ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              )} />
            </div>
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground truncate">
                  {document.filename}
                </h3>
                <p className="text-small text-muted-foreground">
                  {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                </p>
              </div>

              {/* Status badge */}
              <Badge variant={statusConfig.variant} className="flex-shrink-0 gap-1">
                <StatusIcon
                  className={cn(
                    'h-3 w-3',
                    document.processingStatus === 'processing' && 'animate-spin'
                  )}
                />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Document type and metadata */}
            {document.processingStatus === 'completed' && (
              <div className="mt-2 flex items-center gap-2 text-small text-muted-foreground">
                {/* CSV type label */}
                {!isPDF && csvTypeLabel && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    {csvTypeLabel}
                  </span>
                )}
                {/* PDF schema label */}
                {isPDF && pdfSchemaLabel && (
                  <span className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                    {pdfSchemaLabel}
                  </span>
                )}
                {/* Row count for CSV */}
                {!isPDF && document.rowCount && (
                  <span>{document.rowCount} rows</span>
                )}
              </div>
            )}

            {/* Error message */}
            {document.processingStatus === 'error' && document.errorMessage && (
              <p className="mt-2 text-small text-destructive">
                {document.errorMessage}
              </p>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {document.processingStatus === 'completed' && onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(document)}
                >
                  View Data
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
