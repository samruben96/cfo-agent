/**
 * Document Announcement Component for Chat
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #9, #10: AI announces document uploads with metrics and suggested questions
 */

'use client'

import { FileText, FileSpreadsheet, TrendingUp, Users, DollarSign, Calendar, BarChart3 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SmartSummary, KeyMetric } from '@/lib/documents/smart-summary'

interface DocumentAnnouncementProps {
  /** Smart summary from document processing */
  summary: SmartSummary
  /** Suggested follow-up questions */
  suggestedQuestions: string[]
  /** Callback when a suggested question is clicked */
  onQuestionClick?: (question: string) => void
  /** Whether the document is still processing */
  isProcessing?: boolean
  /** Optional filename for display */
  filename?: string
  /** Whether this is a PDF document */
  isPDF?: boolean
  className?: string
}

/**
 * Get icon for metric type
 */
function getMetricIcon(metric: KeyMetric) {
  const label = metric.label.toLowerCase()
  if (label.includes('revenue') || label.includes('income') || label.includes('total')) {
    return DollarSign
  }
  if (label.includes('expense') || label.includes('cost')) {
    return TrendingUp
  }
  if (label.includes('employee') || label.includes('headcount')) {
    return Users
  }
  if (label.includes('period') || label.includes('date')) {
    return Calendar
  }
  return BarChart3
}

/**
 * Generate announcement message based on document type
 */
function generateAnnouncementMessage(summary: SmartSummary): string {
  const docTypeName = getDocumentTypeName(summary.documentType)

  // Build message based on available data
  if (summary.metrics.length === 0) {
    return `I've processed your ${docTypeName}. Ask me anything about it!`
  }

  // Find key metrics to highlight
  const topMetrics = summary.metrics.slice(0, 2)
  const metricText = topMetrics
    .map(m => `${m.label}: ${m.value}`)
    .join(', ')

  const itemCountText = summary.itemCount
    ? ` with ${summary.itemCount.toLocaleString()} items`
    : ''

  const dateRangeText = summary.dateRange
    ? ` (${summary.dateRange.start}${summary.dateRange.start !== summary.dateRange.end ? ` - ${summary.dateRange.end}` : ''})`
    : ''

  return `I've analyzed your ${docTypeName}${itemCountText}${dateRangeText}. Here's what I found: ${metricText}. Ask me anything about it!`
}

/**
 * Get human-readable document type name
 */
function getDocumentTypeName(type: SmartSummary['documentType']): string {
  switch (type) {
    case 'pl': return 'P&L statement'
    case 'payroll': return 'payroll report'
    case 'expense': return 'expense report'
    case 'employees': return 'employee data'
    case 'csv': return 'data file'
    case 'pdf': return 'document'
    default: return 'document'
  }
}

/**
 * Document announcement displayed in chat when a document is uploaded and processed
 */
export function DocumentAnnouncement({
  summary,
  suggestedQuestions,
  onQuestionClick,
  isProcessing = false,
  filename,
  isPDF = false,
  className
}: DocumentAnnouncementProps) {
  const FileIcon = isPDF ? FileText : FileSpreadsheet
  const announcementMessage = generateAnnouncementMessage(summary)

  return (
    <div className={cn('flex gap-3 max-w-[85%]', className)}>
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <span className="text-xs font-bold text-primary-foreground">AI</span>
      </div>

      <div className="flex-1 space-y-3">
        {/* Document Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* File Icon */}
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                isPDF ? 'bg-red-100 dark:bg-red-950/30' : 'bg-primary/10'
              )}>
                <FileIcon className={cn(
                  'h-5 w-5',
                  isPDF ? 'text-red-600 dark:text-red-400' : 'text-primary'
                )} />
              </div>

              <div className="flex-1 min-w-0">
                {/* Title and Type */}
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground truncate">
                    {summary.title}
                  </h4>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {getDocumentTypeName(summary.documentType)}
                  </Badge>
                </div>

                {/* Filename if different from title */}
                {filename && filename !== summary.title && (
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {filename}
                  </p>
                )}

                {/* Key Metrics */}
                {summary.metrics.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {summary.metrics.slice(0, 3).map((metric, index) => {
                      const Icon = getMetricIcon(metric)
                      return (
                        <div key={index} className="flex items-center gap-1.5 text-sm">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{metric.label}:</span>
                          <span className="font-medium text-foreground">{metric.value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Item Count & Date Range */}
                {(summary.itemCount || summary.dateRange) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {summary.itemCount && (
                      <span>{summary.itemCount.toLocaleString()} items</span>
                    )}
                    {summary.dateRange && (
                      <span>
                        {summary.dateRange.start === summary.dateRange.end
                          ? summary.dateRange.start
                          : `${summary.dateRange.start} - ${summary.dateRange.end}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcement Message */}
        <p className="text-foreground">
          {isProcessing
            ? "I'm still processing your document, but you can start asking questions! Full data will be available shortly."
            : announcementMessage}
        </p>

        {/* Suggested Questions - show even when processing */}
        {suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1.5 px-3 text-muted-foreground hover:text-foreground"
                onClick={() => onQuestionClick?.(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Generate a chat message string for document announcement.
 * Used when integrating with the AI SDK chat flow.
 */
export function formatDocumentAnnouncementMessage(
  summary: SmartSummary,
  suggestedQuestions: string[]
): string {
  const message = generateAnnouncementMessage(summary)

  // Format with suggested questions in a way the chat can parse
  const suggestions = suggestedQuestions.length > 0
    ? `\n\n---\nSuggested questions:\n${suggestedQuestions.map(q => `- ${q}`).join('\n')}`
    : ''

  return `${message}${suggestions}`
}
