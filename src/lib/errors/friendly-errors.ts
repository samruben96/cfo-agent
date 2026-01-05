/**
 * Friendly Error Messages Utility
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #11: Conversational error handling
 *
 * Converts technical errors into user-friendly, conversational messages
 * that help users understand what went wrong and what to do next.
 */

/**
 * Error context categories for targeted messaging
 */
export type ErrorContext =
  | 'document_upload'
  | 'document_processing'
  | 'csv_import'
  | 'api_request'
  | 'auth'
  | 'data_entry'
  | 'chat'
  | 'general'

/**
 * Friendly error result with message and optional action
 */
export interface FriendlyError {
  message: string
  suggestion?: string
  isRetryable: boolean
}

/**
 * Common error patterns and their friendly mappings
 */
const errorPatterns: Array<{
  pattern: RegExp | string[]
  context?: ErrorContext[]
  getMessage: (match?: string) => FriendlyError
}> = [
  // Network/Connection errors
  {
    pattern: ['network', 'connection', 'fetch failed', 'offline', 'ECONNREFUSED'],
    getMessage: () => ({
      message: "We couldn't connect to our servers.",
      suggestion: 'Check your internet connection and try again.',
      isRetryable: true,
    }),
  },

  // Timeout errors
  {
    pattern: ['timeout', 'timed out', 'too long', 'exceeded', 'ETIMEDOUT'],
    context: ['document_processing'],
    getMessage: () => ({
      message: 'This document is taking longer than expected to process.',
      suggestion: 'Try uploading a simpler file, or export your data as CSV for faster processing.',
      isRetryable: true,
    }),
  },

  // Rate limiting
  {
    pattern: ['rate limit', '429', 'too many requests'],
    getMessage: () => ({
      message: "We're getting a lot of requests right now.",
      suggestion: 'Please wait a moment and try again.',
      isRetryable: true,
    }),
  },

  // Authentication errors
  {
    pattern: ['unauthorized', '401', 'session expired', 'not authenticated'],
    getMessage: () => ({
      message: 'Your session has expired.',
      suggestion: 'Please refresh the page to sign in again.',
      isRetryable: false,
    }),
  },

  // Permission errors
  {
    pattern: ['forbidden', '403', 'permission denied', 'access denied'],
    getMessage: () => ({
      message: "You don't have permission to do that.",
      suggestion: 'Contact your administrator if you need access.',
      isRetryable: false,
    }),
  },

  // Not found errors
  {
    pattern: ['not found', '404', 'does not exist'],
    getMessage: () => ({
      message: "We couldn't find what you're looking for.",
      suggestion: 'It may have been moved or deleted.',
      isRetryable: false,
    }),
  },

  // File format errors
  {
    pattern: ['unsupported', 'invalid file', 'corrupt', 'cannot read', 'format'],
    context: ['document_upload', 'document_processing'],
    getMessage: () => ({
      message: "We couldn't read this file.",
      suggestion: 'Try exporting it as PDF or CSV from your accounting software.',
      isRetryable: false,
    }),
  },

  // File size errors
  {
    pattern: ['too large', 'file size', 'exceeds limit'],
    getMessage: () => ({
      message: 'This file is too large to upload.',
      suggestion: 'Try splitting it into smaller files or compressing it.',
      isRetryable: false,
    }),
  },

  // Extraction/parsing errors
  {
    pattern: ['extract', 'parse', 'no data', 'empty', 'unrecognized'],
    context: ['document_processing', 'csv_import'],
    getMessage: () => ({
      message: "We couldn't find any data to import from this file.",
      suggestion: 'Make sure the file contains the data you expect, or try entering it manually.',
      isRetryable: false,
    }),
  },

  // Validation errors
  {
    pattern: ['required', 'missing', 'invalid', 'must be'],
    context: ['data_entry', 'csv_import'],
    getMessage: () => ({
      message: 'Some information is missing or incorrect.',
      suggestion: 'Please check the highlighted fields and try again.',
      isRetryable: true,
    }),
  },

  // Duplicate errors
  {
    pattern: ['duplicate', 'already exists', 'unique constraint'],
    getMessage: () => ({
      message: 'This item already exists.',
      suggestion: 'Try updating the existing one instead.',
      isRetryable: false,
    }),
  },

  // Server errors
  {
    pattern: ['500', 'internal server error', 'server error'],
    getMessage: () => ({
      message: 'Something went wrong on our end.',
      suggestion: "We're looking into it. Please try again in a moment.",
      isRetryable: true,
    }),
  },
]

/**
 * Context-specific fallback messages when no pattern matches
 */
const contextFallbacks: Record<ErrorContext, FriendlyError> = {
  document_upload: {
    message: 'We had trouble uploading this file.',
    suggestion: 'Please try again, or try a different file.',
    isRetryable: true,
  },
  document_processing: {
    message: 'We had trouble processing this document.',
    suggestion: 'Try uploading a CSV file for more reliable processing.',
    isRetryable: true,
  },
  csv_import: {
    message: 'We had trouble importing this data.',
    suggestion: 'Check that your CSV has the expected columns and try again.',
    isRetryable: true,
  },
  api_request: {
    message: 'Something went wrong with your request.',
    suggestion: 'Please try again.',
    isRetryable: true,
  },
  auth: {
    message: 'There was a problem with your account.',
    suggestion: 'Try signing in again.',
    isRetryable: false,
  },
  data_entry: {
    message: "We couldn't save your changes.",
    suggestion: 'Please check the form and try again.',
    isRetryable: true,
  },
  chat: {
    message: 'Failed to send your message.',
    suggestion: 'Please try again.',
    isRetryable: true,
  },
  general: {
    message: 'Something went wrong.',
    suggestion: 'Please try again.',
    isRetryable: true,
  },
}

/**
 * Convert a technical error message into a user-friendly, conversational message.
 *
 * @param error - The error to convert (Error object or string)
 * @param context - The context in which the error occurred
 * @returns A friendly error object with message, suggestion, and retryable flag
 *
 * @example
 * ```ts
 * const friendly = getFriendlyError('Network connection failed', 'document_upload')
 * toast.error(friendly.message, { description: friendly.suggestion })
 * ```
 */
export function getFriendlyError(
  error: Error | string | unknown,
  context: ErrorContext = 'general'
): FriendlyError {
  // Extract error message
  let errorMessage = ''
  if (typeof error === 'string') {
    errorMessage = error
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message)
  }

  const lowerMessage = errorMessage.toLowerCase()

  // Try to match a pattern
  for (const pattern of errorPatterns) {
    // Check context filter if specified
    if (pattern.context && !pattern.context.includes(context)) {
      continue
    }

    // Check pattern match
    const patterns = Array.isArray(pattern.pattern) ? pattern.pattern : [pattern.pattern]
    for (const p of patterns) {
      if (typeof p === 'string') {
        if (lowerMessage.includes(p.toLowerCase())) {
          return pattern.getMessage()
        }
      } else if (p.test(lowerMessage)) {
        return pattern.getMessage()
      }
    }
  }

  // Return context-specific fallback
  return contextFallbacks[context]
}

/**
 * Format a friendly error for toast notification.
 * Returns the message with optional suggestion as description.
 */
export function formatForToast(friendlyError: FriendlyError): {
  title: string
  description?: string
} {
  return {
    title: friendlyError.message,
    description: friendlyError.suggestion,
  }
}

/**
 * Convenience function to get toast-ready error message.
 *
 * @example
 * ```ts
 * const toastError = getToastError(error, 'document_upload')
 * toast.error(toastError.title, { description: toastError.description })
 * ```
 */
export function getToastError(
  error: Error | string | unknown,
  context: ErrorContext = 'general'
): { title: string; description?: string } {
  return formatForToast(getFriendlyError(error, context))
}
