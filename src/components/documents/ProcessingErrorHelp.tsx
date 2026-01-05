'use client'

import { AlertCircle, RefreshCw, FileText, Wifi, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Error type categories for resolution suggestions.
 */
export type ErrorCategory = 'format' | 'timeout' | 'extraction' | 'network' | 'unknown'

interface ProcessingErrorHelpProps {
  /** The error message from processing */
  errorMessage?: string
  /** Callback for retry action */
  onRetry?: () => void
  /** Callback for manual entry action */
  onManualEntry?: () => void
  /** Callback for "Chat to resolve" action - AC #17, #18 */
  onChatToResolve?: () => void
  /** Additional CSS class names */
  className?: string
}

/**
 * Categorize error based on error message keywords.
 */
function categorizeError(errorMessage: string | undefined): ErrorCategory {
  if (!errorMessage) return 'unknown'

  const msg = errorMessage.toLowerCase()

  // Processing timeout errors - check first as these are specific
  // Also catches "TIMEOUT:" prefix from server action
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('too long') ||
    msg.includes('too complex') ||
    msg.includes('exceeded') ||
    msg.includes('limit')
  ) {
    return 'timeout'
  }

  // Network-related errors (but not timeout which we already caught)
  if (
    msg.includes('network') ||
    msg.includes('connection') ||
    msg.includes('fetch') ||
    msg.includes('offline')
  ) {
    return 'network'
  }

  // Format-related errors
  if (
    msg.includes('format') ||
    msg.includes('unsupported') ||
    msg.includes('invalid file') ||
    msg.includes('corrupt') ||
    msg.includes('cannot read')
  ) {
    return 'format'
  }

  // Extraction-related errors
  if (
    msg.includes('extract') ||
    msg.includes('parse') ||
    msg.includes('no data') ||
    msg.includes('empty') ||
    msg.includes('unrecognized')
  ) {
    return 'extraction'
  }

  return 'unknown'
}

/**
 * Get resolution suggestions for each error category.
 */
function getSuggestions(category: ErrorCategory): {
  title: string
  description: string
  icon: typeof AlertCircle
  actions: Array<{ label: string; type: 'retry' | 'upload' | 'manual' | 'support' | 'chat' }>
} {
  switch (category) {
    case 'format':
      return {
        title: 'File format issue',
        description: 'The file may be in an unsupported format or corrupted. Try exporting to a standard format.',
        icon: FileText,
        actions: [
          { label: 'Chat to resolve', type: 'chat' },
          { label: 'Upload different file', type: 'upload' },
          { label: 'Enter data manually', type: 'manual' },
        ],
      }
    case 'timeout':
      return {
        title: 'Document too complex',
        description: 'This document has complex tables or formatting that couldn\'t be processed automatically. For best results, export your data as a CSV file from your accounting software and upload that instead.',
        icon: RefreshCw,
        actions: [
          { label: 'Chat to resolve', type: 'chat' },
          { label: 'Upload CSV instead', type: 'upload' },
          { label: 'Enter data manually', type: 'manual' },
        ],
      }
    case 'extraction':
      return {
        title: 'Could not extract data',
        description: 'The document structure was not recognized. You can enter the data manually.',
        icon: FileText,
        actions: [
          { label: 'Chat to resolve', type: 'chat' },
          { label: 'Enter data manually', type: 'manual' },
          { label: 'Contact support', type: 'support' },
        ],
      }
    case 'network':
      return {
        title: 'Connection issue',
        description: 'Check your internet connection and try again.',
        icon: Wifi,
        actions: [
          { label: 'Retry', type: 'retry' },
          { label: 'Chat to resolve', type: 'chat' },
        ],
      }
    default:
      return {
        title: 'Processing failed',
        description: 'Something went wrong. Please try again or contact support.',
        icon: HelpCircle,
        actions: [
          { label: 'Chat to resolve', type: 'chat' },
          { label: 'Try again', type: 'retry' },
        ],
      }
  }
}

/**
 * ProcessingErrorHelp provides contextual help and resolution suggestions
 * when document processing fails.
 *
 * @example
 * ```tsx
 * <ProcessingErrorHelp
 *   errorMessage="File format not supported"
 *   onRetry={() => handleRetry()}
 *   onManualEntry={() => navigateToManualEntry()}
 * />
 * ```
 */
export function ProcessingErrorHelp({
  errorMessage,
  onRetry,
  onManualEntry,
  onChatToResolve,
  className,
}: ProcessingErrorHelpProps) {
  const category = categorizeError(errorMessage)
  const suggestions = getSuggestions(category)
  const Icon = suggestions.icon

  const handleAction = (actionType: 'retry' | 'upload' | 'manual' | 'support' | 'chat') => {
    switch (actionType) {
      case 'retry':
      case 'upload':
        onRetry?.()
        break
      case 'manual':
        onManualEntry?.()
        break
      case 'chat':
        onChatToResolve?.()
        break
      case 'support':
        // Open support link or contact modal
        const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com'
        window.open(`mailto:${supportEmail}?subject=Document Processing Issue`, '_blank')
        break
    }
  }

  return (
    <Card className={cn('border-destructive/50', className)}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-medium text-foreground">{suggestions.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {suggestions.description}
              </p>
              {errorMessage && (
                <p className="text-xs text-destructive mt-2 font-mono bg-destructive/5 px-2 py-1 rounded">
                  {errorMessage}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.actions.map((action) => (
                <Button
                  key={action.type}
                  variant={action.type === 'retry' || action.type === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAction(action.type)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { categorizeError }
