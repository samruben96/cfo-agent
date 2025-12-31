/**
 * Unit tests for PDF processor.
 * Story: 3.4 PDF Document Upload
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  detectDocumentType,
  processPDF,
  processPDFWithFallback,
  processPDFWithTextExtraction,
  processPDFWithAutoFallback,
  PDFProcessingTimeoutError
} from './pdf-processor'

import type { PLExtraction, PayrollExtraction, GenericExtraction } from './extraction-schemas'

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

// Mock the openai module
vi.mock('@/lib/ai/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}))

// Import mocked function for assertions
import { generateObject } from 'ai'
const mockGenerateObject = vi.mocked(generateObject)

describe('detectDocumentType', () => {
  it('detects P&L documents from filename', () => {
    expect(detectDocumentType('Q4-P&L-Report.pdf')).toBe('pl')
    expect(detectDocumentType('profit_loss_2024.pdf')).toBe('pl')
    expect(detectDocumentType('income_statement.pdf')).toBe('pl')
    expect(detectDocumentType('income-statement-jan.pdf')).toBe('pl')
    expect(detectDocumentType('pl_report.pdf')).toBe('pl')
    expect(detectDocumentType('monthly_pl.pdf')).toBe('pl')
  })

  it('detects payroll documents from filename', () => {
    expect(detectDocumentType('payroll_report.pdf')).toBe('payroll')
    expect(detectDocumentType('Q1-Payroll.pdf')).toBe('payroll')
    expect(detectDocumentType('pay_summary.pdf')).toBe('payroll')
    expect(detectDocumentType('employee_pay.pdf')).toBe('payroll')
    expect(detectDocumentType('salary_report.pdf')).toBe('payroll')
    expect(detectDocumentType('wages_2024.pdf')).toBe('payroll')
    expect(detectDocumentType('compensation_breakdown.pdf')).toBe('payroll')
  })

  it('returns generic for unrecognized filenames', () => {
    expect(detectDocumentType('document.pdf')).toBe('generic')
    expect(detectDocumentType('financial_data.pdf')).toBe('generic')
    expect(detectDocumentType('report.pdf')).toBe('generic')
    expect(detectDocumentType('scan_001.pdf')).toBe('generic')
  })

  it('is case-insensitive', () => {
    expect(detectDocumentType('P&L_REPORT.PDF')).toBe('pl')
    expect(detectDocumentType('PAYROLL.PDF')).toBe('payroll')
    expect(detectDocumentType('Profit_Loss.PDF')).toBe('pl')
  })
})

describe('processPDF', () => {
  const mockPLResult: PLExtraction = {
    documentType: 'pl',
    revenue: { total: 100000 },
    expenses: { total: 75000 },
    netIncome: 25000,
  }

  const mockPayrollResult: PayrollExtraction = {
    documentType: 'payroll',
    totals: {
      totalGrossPay: 50000,
      totalNetPay: 35000,
      employeeCount: 10,
    },
  }

  const mockGenericResult: GenericExtraction = {
    documentType: 'unknown',
    rawContent: 'Some extracted text content',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes PDF with P&L schema based on filename', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDF({
      file: Buffer.from('mock pdf content'),
      filename: 'Q4-P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('pl')
    expect(result.extractedData).toEqual(mockPLResult)
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)

    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mocked-model',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({ type: 'text' }),
              expect.objectContaining({ type: 'file', mediaType: 'application/pdf' }),
            ]),
          }),
        ]),
      })
    )
  })

  it('processes PDF with payroll schema based on filename', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPayrollResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDF({
      file: Buffer.from('mock pdf content'),
      filename: 'payroll_jan_2025.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('payroll')
    expect(result.extractedData).toEqual(mockPayrollResult)
  })

  it('processes PDF with generic schema for unknown document types', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockGenericResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDF({
      file: Buffer.from('mock pdf content'),
      filename: 'random_document.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('generic')
    expect(result.extractedData).toEqual(mockGenericResult)
  })

  it('uses forceSchema when provided', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPayrollResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDF({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf', // Would normally detect as P&L
      forceSchema: 'payroll', // Force payroll schema
    })

    expect(result.schemaUsed).toBe('payroll')
  })

  it('accepts base64 string as input', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const base64Content = Buffer.from('mock pdf content').toString('base64')
    const result = await processPDF({
      file: base64Content,
      filename: 'P&L.pdf',
    })

    expect(result.success).toBe(true)
  })

  it('throws error on API failure', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit exceeded'))

    await expect(
      processPDF({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
      })
    ).rejects.toThrow('PDF processing failed: API rate limit exceeded')
  })
})

describe('processPDFWithFallback', () => {
  const mockPLResult: PLExtraction = {
    documentType: 'pl',
    revenue: { total: 100000 },
    expenses: { total: 75000 },
  }

  const mockGenericResult: GenericExtraction = {
    documentType: 'unknown',
    rawContent: 'Fallback content',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('succeeds with detected schema on first try', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithFallback({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('pl')
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
  })

  it('falls back to generic schema on extraction failure', async () => {
    // First call fails
    mockGenerateObject.mockRejectedValueOnce(new Error('Schema validation failed'))

    // Second call (fallback) succeeds
    mockGenerateObject.mockResolvedValueOnce({
      object: mockGenericResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithFallback({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('generic')
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)
  })

  it('does not fallback for generic documents', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockGenericResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithFallback({
      file: Buffer.from('mock pdf content'),
      filename: 'unknown_document.pdf',
    })

    expect(result.schemaUsed).toBe('generic')
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
  })

  it('does not fallback when forceSchema is provided', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('Extraction failed'))

    await expect(
      processPDFWithFallback({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
        forceSchema: 'pl',
      })
    ).rejects.toThrow('PDF processing failed')

    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
  })
})

describe('PDFProcessingTimeoutError', () => {
  it('creates error with correct message', () => {
    const error = new PDFProcessingTimeoutError(90000)
    expect(error.message).toBe('PDF processing timed out after 90 seconds. Complex documents may require alternative processing methods.')
    expect(error.name).toBe('PDFProcessingTimeoutError')
  })

  it('is instance of Error', () => {
    const error = new PDFProcessingTimeoutError(90000)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('processPDF timeout handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws PDFProcessingTimeoutError on abort', async () => {
    // Simulate an abort error
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockGenerateObject.mockRejectedValueOnce(abortError)

    await expect(
      processPDF({
        file: Buffer.from('mock pdf content'),
        filename: 'complex-document.pdf',
      })
    ).rejects.toThrow(PDFProcessingTimeoutError)
  })

  it('throws PDFProcessingTimeoutError when error message contains abort', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('Request was aborted due to timeout'))

    await expect(
      processPDF({
        file: Buffer.from('mock pdf content'),
        filename: 'complex-document.pdf',
      })
    ).rejects.toThrow(PDFProcessingTimeoutError)
  })

  it('passes abortSignal to generateObject', async () => {
    const mockPLResult: PLExtraction = {
      documentType: 'pl',
      revenue: { total: 100000 },
      expenses: { total: 75000 },
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    await processPDF({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: expect.any(AbortSignal),
      })
    )
  })

  it('throws regular error for non-abort failures', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit exceeded'))

    await expect(
      processPDF({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
      })
    ).rejects.toThrow('PDF processing failed: API rate limit exceeded')

    // Should NOT be a timeout error
    await expect(
      processPDF({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
      })
    ).rejects.not.toThrow(PDFProcessingTimeoutError)
  })
})

// Mock the pdf-text-extractor module
vi.mock('./pdf-text-extractor', () => ({
  extractPDFText: vi.fn(),
}))

describe('processPDFWithTextExtraction', () => {
  const mockPLResult: PLExtraction = {
    documentType: 'pl',
    revenue: { total: 100000 },
    expenses: { total: 75000 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts text and processes with GPT-4o', async () => {
    // Mock text extraction
    const { extractPDFText } = await import('./pdf-text-extractor')
    const mockExtractPDFText = vi.mocked(extractPDFText)
    mockExtractPDFText.mockResolvedValueOnce({
      success: true,
      text: 'Revenue: 100000\nExpenses: 75000',
      pageTexts: ['Revenue: 100000\nExpenses: 75000'],
      pageCount: 1,
      processingTimeMs: 50,
    })

    // Mock GPT-4o response
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithTextExtraction({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('pl')
    expect(result.extractedData).toEqual(mockPLResult)
    expect(mockExtractPDFText).toHaveBeenCalled()
  })

  it('throws error when text extraction fails', async () => {
    const { extractPDFText } = await import('./pdf-text-extractor')
    const mockExtractPDFText = vi.mocked(extractPDFText)
    mockExtractPDFText.mockResolvedValueOnce({
      success: false,
      text: '',
      pageTexts: [],
      pageCount: 0,
      processingTimeMs: 10,
      error: 'Invalid PDF format',
    })

    await expect(
      processPDFWithTextExtraction({
        file: Buffer.from('invalid pdf'),
        filename: 'document.pdf',
      })
    ).rejects.toThrow('Text extraction failed: Invalid PDF format')
  })
})

describe('processPDFWithAutoFallback', () => {
  const mockPLResult: PLExtraction = {
    documentType: 'pl',
    revenue: { total: 100000 },
    expenses: { total: 75000 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('succeeds with Vision API on first try', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithAutoFallback({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    expect(result.schemaUsed).toBe('pl')
  })

  it('falls back to text extraction on timeout', async () => {
    // First call times out
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockGenerateObject.mockRejectedValueOnce(abortError)

    // Mock text extraction
    const { extractPDFText } = await import('./pdf-text-extractor')
    const mockExtractPDFText = vi.mocked(extractPDFText)
    mockExtractPDFText.mockResolvedValueOnce({
      success: true,
      text: 'Revenue: 100000\nExpenses: 75000',
      pageTexts: ['Revenue: 100000\nExpenses: 75000'],
      pageCount: 1,
      processingTimeMs: 50,
    })

    // Text extraction call succeeds
    mockGenerateObject.mockResolvedValueOnce({
      object: mockPLResult,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    } as never)

    const result = await processPDFWithAutoFallback({
      file: Buffer.from('mock pdf content'),
      filename: 'P&L-Report.pdf',
    })

    expect(result.success).toBe(true)
    // Should have called generateObject twice (once for Vision, once for text extraction)
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)
  })

  it('rethrows non-timeout errors', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit exceeded'))

    await expect(
      processPDFWithAutoFallback({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
      })
    ).rejects.toThrow('PDF processing failed: API rate limit exceeded')
  })

  it('throws combined error when both Vision and text extraction fail', async () => {
    // First call times out
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockGenerateObject.mockRejectedValueOnce(abortError)

    // Mock text extraction to fail
    const { extractPDFText } = await import('./pdf-text-extractor')
    const mockExtractPDFText = vi.mocked(extractPDFText)
    mockExtractPDFText.mockResolvedValueOnce({
      success: false,
      text: '',
      pageTexts: [],
      pageCount: 0,
      processingTimeMs: 10,
      error: 'Invalid PDF format',
    })

    await expect(
      processPDFWithAutoFallback({
        file: Buffer.from('mock pdf content'),
        filename: 'document.pdf',
      })
    ).rejects.toThrow('Vision API timed out, and text extraction fallback failed')
  })
})
