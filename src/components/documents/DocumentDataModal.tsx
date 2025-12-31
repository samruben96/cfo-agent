'use client'

import { useState, useEffect } from 'react'

import { Loader2, FileSpreadsheet, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { getDocumentData } from '@/actions/documents'
import { getCSVTypeLabel } from '@/lib/documents/csv-type-detector'

import type { Document } from '@/types/documents'

interface DocumentDataModalProps {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

interface DocumentData {
  headers: string[]
  rows: Record<string, unknown>[]
  totalRows: number
}

export function DocumentDataModal({
  document,
  open,
  onOpenChange,
  className
}: DocumentDataModalProps) {
  const [data, setData] = useState<DocumentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function loadData() {
      if (!document) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await getDocumentData(document.id)

        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setData(result.data)
        }
      } catch {
        setError('Failed to load document data')
      } finally {
        setIsLoading(false)
      }
    }

    if (open && document) {
      loadData()
    } else {
      // Reset state when closed
      setData(null)
      setError(null)
    }
  }, [open, document, retryCount])

  const handleRetry = () => setRetryCount((c) => c + 1)

  const isPDF = document?.fileType === 'pdf'
  const csvTypeLabel = document?.csvType ? getCSVTypeLabel(document.csvType) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-5xl max-h-[85vh] flex flex-col', className)}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            {isPDF ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : (
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">
                {document?.filename || 'Document Data'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {csvTypeLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {csvTypeLabel}
                  </Badge>
                )}
                {data && (
                  <span className="text-xs text-muted-foreground">
                    {data.totalRows} rows × {data.headers.length} columns
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading data...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {data && !isLoading && !error && (
            <ScrollArea className="h-full rounded-md border">
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center bg-muted/50 sticky left-0 z-10">
                        #
                      </TableHead>
                      {data.headers.map((header, i) => (
                        <TableHead
                          key={`${header}-${i}`}
                          className="whitespace-nowrap bg-muted/50"
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="text-center text-muted-foreground text-xs bg-muted/30 sticky left-0">
                          {rowIndex + 1}
                        </TableCell>
                        {data.headers.map((header, colIndex) => (
                          <TableCell
                            key={`${rowIndex}-${colIndex}`}
                            className="whitespace-nowrap max-w-[300px] truncate"
                          >
                            {String(row[header] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {data && data.rows.length < data.totalRows && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Showing first {data.rows.length} of {data.totalRows} rows
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
