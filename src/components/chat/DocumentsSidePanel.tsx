/**
 * Documents Side Panel for Chat
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #12, #13: Collapsible side panel showing recent documents with smart summaries
 */

'use client'

import { useState, useMemo } from 'react'

import {
  X,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Check
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { generateSmartSummary, type SmartSummary } from '@/lib/documents/smart-summary'
import type { Document } from '@/types/documents'

interface DocumentsSidePanelProps {
  /** Whether the panel is open */
  open: boolean
  /** Callback to close the panel */
  onClose: () => void
  /** List of documents to display */
  documents: Document[]
  /** Currently selected document IDs for multi-select */
  selectedDocumentIds?: string[]
  /** Callback when document selection changes */
  onSelectionChange?: (documentIds: string[]) => void
  /** Callback when "View data" is clicked */
  onViewData?: (document: Document) => void
  /** Callback when "Download" is clicked */
  onDownload?: (document: Document) => void
  /** Callback when "Delete" is clicked */
  onDelete?: (document: Document) => void
  className?: string
}

/**
 * Document item in the side panel with smart summary and selection
 */
function DocumentItem({
  document,
  summary,
  isSelected,
  onToggleSelect,
  onViewData,
  onDownload,
  onDelete
}: {
  document: Document
  summary: SmartSummary
  isSelected: boolean
  onToggleSelect?: () => void
  onViewData?: () => void
  onDownload?: () => void
  onDelete?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isPDF = document.fileType === 'pdf'
  const FileIcon = isPDF ? FileText : FileSpreadsheet

  // Get top 2 metrics to show in collapsed view
  const previewMetrics = summary.metrics.slice(0, 2)

  return (
    <div className={cn(
      'border rounded-lg bg-card transition-colors overflow-hidden w-full',
      isSelected && 'border-primary bg-primary/5'
    )}>
      {/* Collapsed header */}
      <div className="flex items-start gap-2 p-3 min-w-0 overflow-hidden">
        {/* Selection checkbox */}
        <button
          onClick={onToggleSelect}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input hover:border-primary'
          )}
          aria-label={isSelected ? 'Deselect document' : 'Select document'}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>

        {/* Expandable content - grid layout for reliable truncation */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 min-w-0 grid grid-cols-[auto_1fr_auto] gap-2 items-start hover:bg-muted/50 rounded transition-colors text-left cursor-pointer -m-1 p-1"
        >
          {/* Icon */}
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            isPDF ? 'bg-red-100 dark:bg-red-950/30' : 'bg-primary/10'
          )}>
            <FileIcon className={cn(
              'h-4 w-4',
              isPDF ? 'text-red-600 dark:text-red-400' : 'text-primary'
            )} />
          </div>

          {/* Content - title with proper truncation using overflow-hidden container */}
          <div className="min-w-0 overflow-hidden">
            <p className="font-medium text-sm text-foreground truncate">
              {summary.title}
            </p>
            {/* Preview metrics - shown in collapsed state */}
            {!isExpanded && previewMetrics.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {previewMetrics.map(m => `${m.label}: ${m.value}`).join(' • ')}
              </p>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight className={cn(
            'h-3 w-3 text-muted-foreground transition-transform flex-shrink-0 mt-1',
            isExpanded && 'rotate-90'
          )} />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-7">
          {/* Full metrics list */}
          {summary.metrics.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {summary.metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-foreground">{metric.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            {summary.itemCount && <span>{summary.itemCount} items</span>}
            {summary.dateRange && (
              <>
                {summary.itemCount && <span>•</span>}
                <span>
                  {summary.dateRange.start === summary.dateRange.end
                    ? summary.dateRange.start
                    : `${summary.dateRange.start} - ${summary.dateRange.end}`}
                </span>
              </>
            )}
          </div>

          {/* Actions (dropdown only, no Chat about this button) */}
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewData && (
                  <DropdownMenuItem onClick={onViewData}>
                    <Eye className="h-4 w-4 mr-2" />
                    View data
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Side panel showing user's documents with smart summaries and multi-select
 */
export function DocumentsSidePanel({
  open,
  onClose,
  documents,
  selectedDocumentIds = [],
  onSelectionChange,
  onViewData,
  onDownload,
  onDelete,
  className
}: DocumentsSidePanelProps) {
  // Generate summaries for all documents
  const documentSummaries = useMemo(() => {
    return documents.map(doc => ({
      document: doc,
      summary: generateSmartSummary(doc)
    }))
  }, [documents])

  // Filter to completed documents only
  const completedDocs = documentSummaries.filter(
    ({ document }) => document.processingStatus === 'completed'
  )

  const processingDocs = documentSummaries.filter(
    ({ document }) => document.processingStatus === 'processing'
  )

  // Handle toggling document selection
  const handleToggleSelect = (documentId: string) => {
    if (!onSelectionChange) return

    if (selectedDocumentIds.includes(documentId)) {
      onSelectionChange(selectedDocumentIds.filter(id => id !== documentId))
    } else {
      onSelectionChange([...selectedDocumentIds, documentId])
    }
  }

  // Count selected
  const selectedCount = selectedDocumentIds.length

  return (
    <>
      {/* Backdrop overlay - click to close */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 w-80 bg-background border-l border-border',
          'transition-transform duration-200 ease-in-out z-50',
          open ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="font-semibold text-foreground">My Documents</h2>
          {selectedCount > 0 && (
            <p className="text-xs text-primary">
              {selectedCount} selected for reference
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="p-4 space-y-3">
          {/* Selection hint */}
          {completedDocs.length > 0 && selectedCount === 0 && (
            <p className="text-xs text-muted-foreground pb-2">
              Select documents to reference in your chat
            </p>
          )}

          {/* Processing documents */}
          {processingDocs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Processing
              </h3>
              {processingDocs.map(({ document }) => (
                <div
                  key={document.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    {document.fileType === 'pdf' ? (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{document.filename}</p>
                    <p className="text-xs text-muted-foreground">Processing...</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed documents */}
          {completedDocs.length > 0 ? (
            <>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Documents
              </h3>
              {completedDocs.map(({ document, summary }) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  summary={summary}
                  isSelected={selectedDocumentIds.includes(document.id)}
                  onToggleSelect={() => handleToggleSelect(document.id)}
                  onViewData={() => onViewData?.(document)}
                  onDownload={() => onDownload?.(document)}
                  onDelete={() => onDelete?.(document)}
                />
              ))}
            </>
          ) : processingDocs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No documents yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drop a file in the chat to get started
              </p>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
    </>
  )
}

export type { DocumentsSidePanelProps }
