'use client'

import { FileSpreadsheet, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DocumentCard } from './DocumentCard'

import type { Document } from '@/types/documents'
import type { FileTypeFilter } from './DocumentsClient'
import type { DocumentProgressState } from '@/hooks/use-processing-progress'

interface DocumentListProps {
  documents: Document[]
  onDelete: (documentId: string) => Promise<void>
  onView?: (document: Document) => void
  onDownload?: (document: Document) => Promise<void>
  onRetry?: (document: Document) => void
  /** Callback for "Chat to resolve" error action - AC #17, #18 */
  onChatToResolve?: (document: Document) => void
  /** Map of document IDs to their progress states */
  progressMap?: Map<string, DocumentProgressState>
  fileTypeFilter?: FileTypeFilter
  className?: string
}

function getEmptyStateContent(filter: FileTypeFilter) {
  switch (filter) {
    case 'csv':
      return {
        icon: FileSpreadsheet,
        title: 'No CSV files',
        description: 'Upload a CSV file to import spreadsheet data like expenses or payroll.',
      }
    case 'pdf':
      return {
        icon: FileText,
        title: 'No PDF files',
        description: 'Upload a PDF document like a P&L report or payroll summary to extract financial data.',
      }
    default:
      return {
        icon: FileText,
        title: 'No documents yet',
        description: 'Upload a CSV or PDF file above to get started with importing your financial data.',
      }
  }
}

export function DocumentList({
  documents,
  onDelete,
  onView,
  onDownload,
  onRetry,
  onChatToResolve,
  progressMap,
  fileTypeFilter = 'all',
  className
}: DocumentListProps) {
  if (documents.length === 0) {
    const { icon: Icon, title, description } = getEmptyStateContent(fileTypeFilter)
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-body font-medium text-foreground mb-1">
          {title}
        </h3>
        <p className="text-small text-muted-foreground max-w-sm">
          {description}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {documents.map((document) => {
        const docProgress = progressMap?.get(document.id)
        return (
          <DocumentCard
            key={document.id}
            document={document}
            onDelete={onDelete}
            onView={onView}
            onDownload={onDownload}
            onRetry={onRetry}
            onChatToResolve={onChatToResolve}
            processingStage={docProgress?.stage}
            elapsedSeconds={docProgress?.elapsedSeconds}
          />
        )
      })}
    </div>
  )
}
