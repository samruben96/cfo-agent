'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getCSVTypeLabel } from '@/lib/documents/csv-type-detector'

import type { CSVType, ParsedCSVData } from '@/types/documents'

interface CSVPreviewProps {
  data: ParsedCSVData
  onConfirm: () => void
  onCancel: () => void
  onChangeType?: (type: CSVType) => void
  isLoading?: boolean
  className?: string
}

export function CSVPreview({
  data,
  onConfirm,
  onCancel,
  onChangeType,
  isLoading = false,
  className
}: CSVPreviewProps) {
  const previewRows = data.rows.slice(0, 10)
  const typeLabel = getCSVTypeLabel(data.detectedType)
  const confidencePercent = Math.round(data.confidence * 100)

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3">CSV Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={data.detectedType === 'unknown' ? 'destructive' : 'default'}
            >
              {typeLabel}
            </Badge>
            {data.detectedType !== 'unknown' && (
              <span className="text-small text-muted-foreground">
                {confidencePercent}% confidence
              </span>
            )}
          </div>
        </div>
        <p className="text-small text-muted-foreground">
          Showing {previewRows.length} of {data.totalRows} rows
        </p>
      </CardHeader>

      <CardContent>
        {/* Scrollable table container */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {data.headers.map((header, index) => (
                  <th
                    key={`header-${index}`}
                    className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-b"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.headers.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No data to preview
                  </td>
                </tr>
              ) : (
                previewRows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    {data.headers.map((header, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className="px-4 py-2 whitespace-nowrap"
                      >
                        {formatCellValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Type change options if detection is uncertain */}
        {data.detectedType === 'unknown' && onChangeType && (
          <div className="mt-4 p-4 bg-muted/30 rounded-md">
            <p className="text-small font-medium mb-2">
              Unable to detect CSV type. Please select:
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeType('pl')}
              >
                Profit & Loss
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeType('payroll')}
              >
                Payroll Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeType('employees')}
              >
                Employee Roster
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isLoading || data.detectedType === 'unknown'}>
          {isLoading ? 'Processing...' : 'Confirm Import'}
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Format a cell value for display.
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'number') {
    // Format numbers with locale-aware formatting
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
