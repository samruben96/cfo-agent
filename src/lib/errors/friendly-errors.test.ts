/**
 * Tests for Friendly Error Messages Utility
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #11: Conversational error handling
 */

import { describe, it, expect } from 'vitest'
import { getFriendlyError, getToastError, type ErrorContext } from './friendly-errors'

describe('getFriendlyError', () => {
  describe('network errors', () => {
    it('handles connection errors', () => {
      const result = getFriendlyError('Network connection failed')
      expect(result.message).toContain("couldn't connect")
      expect(result.suggestion).toContain('internet connection')
      expect(result.isRetryable).toBe(true)
    })

    it('handles offline errors', () => {
      const result = getFriendlyError('You appear to be offline')
      expect(result.isRetryable).toBe(true)
    })

    it('handles fetch failures', () => {
      const result = getFriendlyError('fetch failed: ECONNREFUSED')
      expect(result.message).toContain("couldn't connect")
    })
  })

  describe('timeout errors', () => {
    it('handles document processing timeouts', () => {
      const result = getFriendlyError('Request timeout', 'document_processing')
      expect(result.message).toContain('longer than expected')
      expect(result.suggestion).toContain('CSV')
    })

    it('handles general timeouts', () => {
      const result = getFriendlyError('ETIMEDOUT')
      expect(result.isRetryable).toBe(true)
    })
  })

  describe('rate limiting', () => {
    it('handles rate limit errors', () => {
      const result = getFriendlyError('Rate limit exceeded')
      expect(result.message).toContain('lot of requests')
      expect(result.suggestion).toContain('wait')
      expect(result.isRetryable).toBe(true)
    })

    it('handles 429 errors', () => {
      const result = getFriendlyError('HTTP 429 Too Many Requests')
      expect(result.message).toContain('lot of requests')
    })
  })

  describe('authentication errors', () => {
    it('handles unauthorized errors', () => {
      const result = getFriendlyError('Unauthorized')
      expect(result.message).toContain('session')
      expect(result.suggestion).toContain('refresh')
      expect(result.isRetryable).toBe(false)
    })

    it('handles 401 errors', () => {
      const result = getFriendlyError('HTTP 401')
      expect(result.isRetryable).toBe(false)
    })

    it('handles session expired', () => {
      const result = getFriendlyError('Session expired')
      expect(result.message).toContain('session')
    })
  })

  describe('file format errors', () => {
    it('handles unsupported format', () => {
      const result = getFriendlyError('Unsupported file format', 'document_upload')
      expect(result.message).toContain("couldn't read")
      expect(result.suggestion).toContain('PDF or CSV')
      expect(result.isRetryable).toBe(false)
    })

    it('handles corrupt files', () => {
      const result = getFriendlyError('File appears to be corrupt', 'document_processing')
      expect(result.message).toContain("couldn't read")
    })
  })

  describe('extraction errors', () => {
    it('handles extraction failures', () => {
      const result = getFriendlyError('Could not extract data', 'document_processing')
      expect(result.message).toContain("couldn't find any data")
      expect(result.suggestion).toContain('manually')
    })

    it('handles empty results', () => {
      const result = getFriendlyError('No data found in file', 'csv_import')
      expect(result.message).toContain("couldn't find any data")
    })
  })

  describe('context-specific fallbacks', () => {
    const contexts: ErrorContext[] = [
      'document_upload',
      'document_processing',
      'csv_import',
      'api_request',
      'auth',
      'data_entry',
      'chat',
      'general',
    ]

    contexts.forEach((context) => {
      it(`provides meaningful fallback for ${context} context`, () => {
        const result = getFriendlyError('Unknown error xyz123', context)
        expect(result.message).toBeTruthy()
        expect(result.message.length).toBeGreaterThan(10)
        expect(result.suggestion).toBeTruthy()
      })
    })
  })

  describe('error input types', () => {
    it('handles Error objects', () => {
      const error = new Error('Network failed')
      const result = getFriendlyError(error)
      expect(result.message).toBeTruthy()
    })

    it('handles string errors', () => {
      const result = getFriendlyError('Something went wrong')
      expect(result.message).toBeTruthy()
    })

    it('handles object with message property', () => {
      const error = { message: 'Custom error message' }
      const result = getFriendlyError(error)
      expect(result.message).toBeTruthy()
    })

    it('handles null/undefined gracefully', () => {
      const result1 = getFriendlyError(null)
      const result2 = getFriendlyError(undefined)
      expect(result1.message).toBeTruthy()
      expect(result2.message).toBeTruthy()
    })
  })
})

describe('getToastError', () => {
  it('returns title and description for toast', () => {
    const result = getToastError('Network failed', 'api_request')
    expect(result.title).toBeTruthy()
    expect(result.description).toBeDefined()
  })

  it('title matches friendly error message', () => {
    const friendlyError = getFriendlyError('Rate limit', 'general')
    const toastError = getToastError('Rate limit', 'general')
    expect(toastError.title).toBe(friendlyError.message)
  })

  it('description matches friendly error suggestion', () => {
    const friendlyError = getFriendlyError('Unauthorized', 'auth')
    const toastError = getToastError('Unauthorized', 'auth')
    expect(toastError.description).toBe(friendlyError.suggestion)
  })
})
