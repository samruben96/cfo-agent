/**
 * PDF processor using OpenAI GPT-5.2 Vision API.
 * Story: 3.4 PDF Document Upload
 *
 * Extracts structured financial data from PDF documents using
 * GPT-5.2's vision capabilities with Zod schema validation.
 */

import { generateObject } from 'ai'

import { openai } from '@/lib/ai/openai'

import {
  plExtractionSchema,
  payrollExtractionSchema,
  expenseExtractionSchema,
  genericExtractionSchema,
} from './extraction-schemas'

import type {
  PLExtraction,
  PayrollExtraction,
  ExpenseExtraction,
  GenericExtraction,
} from './extraction-schemas'

/**
 * PDF processing options.
 */
export interface ProcessPDFOptions {
  /** PDF file as Buffer or base64 string */
  file: Buffer | string
  /** Optional filename for document type detection */
  filename?: string
  /** Force a specific extraction schema */
  forceSchema?: 'pl' | 'payroll' | 'expense' | 'generic'
}

/**
 * PDF processing result.
 */
export interface PDFProcessingResult {
  success: boolean
  extractedData: PLExtraction | PayrollExtraction | GenericExtraction | ExpenseExtraction
  processingTimeMs: number
  schemaUsed: 'pl' | 'payroll' | 'expense' | 'generic'
}

/**
 * Detect document type from filename.
 * Returns the most likely schema to use based on filename patterns.
 */
export function detectDocumentType(filename: string): 'pl' | 'payroll' | 'expense' | 'generic' {
  const lower = filename.toLowerCase()

  // P&L detection patterns
  if (
    lower.includes('p&l') ||
    lower.includes('pl_') ||
    lower.includes('_pl') ||
    lower.includes('profit') ||
    lower.includes('loss') ||
    lower.includes('income_statement') ||
    lower.includes('income-statement')
  ) {
    return 'pl'
  }

  // Payroll detection patterns
  if (
    lower.includes('payroll') ||
    lower.includes('pay_') ||
    lower.includes('_pay') ||
    lower.includes('salary') ||
    lower.includes('wages') ||
    lower.includes('compensation')
  ) {
    return 'payroll'
  }

  // Expense report detection patterns
  if (
    lower.includes('expense') ||
    lower.includes('spending') ||
    lower.includes('operating') ||
    lower.includes('monthly') ||
    lower.includes('cost_report') ||
    lower.includes('cost-report')
  ) {
    return 'expense'
  }

  return 'generic'
}

/**
 * Get the extraction prompt based on document type.
 */
function getExtractionPrompt(schemaType: 'pl' | 'payroll' | 'expense' | 'generic'): string {
  const basePrompt = `You are a financial document extraction expert. Analyze this PDF document and extract structured data.

IMPORTANT INSTRUCTIONS:
- Extract ALL numeric values you can find
- Use negative numbers for expenses/costs
- If a value is not clearly present, omit it (don't guess)
- Dates should be in YYYY-MM-DD format
- Currency values should be plain numbers without symbols

`

  switch (schemaType) {
    case 'pl':
      return basePrompt + `This appears to be a Profit & Loss (P&L) or Income Statement.

Focus on extracting:
- Revenue/Income totals and line items
- Expense categories and amounts
- Net income/profit
- Reporting period dates
- Company name if visible

Set documentType to 'pl', 'income_statement', or 'profit_loss' based on the document title.`

    case 'payroll':
      return basePrompt + `This appears to be a Payroll document.

Focus on extracting:
- Pay period dates
- Employee names and roles
- Gross pay, taxes, benefits, net pay
- Total payroll amounts
- Employee count

Set documentType to 'payroll', 'payroll_summary', or 'payroll_report' based on the document.`

    case 'expense':
      return basePrompt + `This appears to be an Expense Report or Operating Expense document.

Focus on extracting:
- Expense category summaries with amounts (current period, prior period, YTD, budget, variance)
- Individual expense line items with date, vendor, description, category, amount, payment method
- Total expenses for the period
- Reporting period/month
- Company name if visible

Set documentType to 'expense_report', 'operating_expenses', or 'monthly_expenses' based on the document title.`

    case 'generic':
    default:
      return basePrompt + `The document type is unknown.

Extract:
- Any raw text content
- Tables as arrays of strings
- Any numeric values with their labels

Set documentType to 'unknown'.`
  }
}

/**
 * Convert file to base64 string for Vision API.
 */
function toBase64(file: Buffer | string): string {
  if (typeof file === 'string') {
    // Already base64
    return file
  }
  return file.toString('base64')
}

/** Timeout for Vision API calls in milliseconds (90 seconds) */
const VISION_API_TIMEOUT_MS = 90_000

/**
 * Custom error class for timeout errors.
 * Used to distinguish timeout errors from other processing errors.
 */
export class PDFProcessingTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`PDF processing timed out after ${timeoutMs / 1000} seconds. Complex documents may require alternative processing methods.`)
    this.name = 'PDFProcessingTimeoutError'
  }
}

/**
 * Process a PDF document using GPT-5.2 Vision API.
 *
 * @param options - Processing options including file and optional schema override
 * @returns Structured extraction result with timing information
 * @throws PDFProcessingTimeoutError if processing exceeds 90 seconds
 * @throws Error if processing fails for other reasons
 *
 * @example
 * ```ts
 * const result = await processPDF({
 *   file: pdfBuffer,
 *   filename: 'Q4-P&L-Report.pdf'
 * })
 *
 * if (result.success && result.schemaUsed === 'pl') {
 *   console.log('Revenue:', result.extractedData.revenue.total)
 * }
 * ```
 */
export async function processPDF(options: ProcessPDFOptions): Promise<PDFProcessingResult> {
  const startTime = Date.now()

  // Determine which schema to use
  const schemaType = options.forceSchema ?? (options.filename ? detectDocumentType(options.filename) : 'generic')

  // Select the appropriate schema
  const schema = schemaType === 'pl'
    ? plExtractionSchema
    : schemaType === 'payroll'
      ? payrollExtractionSchema
      : schemaType === 'expense'
        ? expenseExtractionSchema
        : genericExtractionSchema

  // Convert file to base64
  const base64File = toBase64(options.file)

  // Get extraction prompt
  const prompt = getExtractionPrompt(schemaType)

  console.log('[PDFProcessor]', {
    action: 'processPDF',
    schemaType,
    filename: options.filename,
  })

  // Create AbortController for timeout handling
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), VISION_API_TIMEOUT_MS)

  try {
    // Call GPT-5.2 Vision API with structured output and timeout
    const { object: extractedData } = await generateObject({
      model: openai('gpt-5.2'),
      schema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'file',
              data: base64File,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
      abortSignal: controller.signal,
    })

    clearTimeout(timeoutId)
    const processingTimeMs = Date.now() - startTime

    console.log('[PDFProcessor]', {
      action: 'processPDF',
      success: true,
      schemaType,
      processingTimeMs,
    })

    return {
      success: true,
      extractedData: extractedData as PLExtraction | PayrollExtraction | ExpenseExtraction | GenericExtraction,
      processingTimeMs,
      schemaUsed: schemaType,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const processingTimeMs = Date.now() - startTime

    // Check if this was a timeout/abort error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
      console.error('[PDFProcessor]', {
        action: 'processPDF',
        success: false,
        error: 'timeout',
        schemaType,
        processingTimeMs,
        timeoutMs: VISION_API_TIMEOUT_MS,
      })

      throw new PDFProcessingTimeoutError(VISION_API_TIMEOUT_MS)
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[PDFProcessor]', {
      action: 'processPDF',
      success: false,
      error: errorMessage,
      schemaType,
      processingTimeMs,
    })

    throw new Error(`PDF processing failed: ${errorMessage}`)
  }
}

/**
 * Process a PDF with automatic retry on generic schema fallback.
 * First attempts with detected schema, falls back to generic on failure.
 */
export async function processPDFWithFallback(options: ProcessPDFOptions): Promise<PDFProcessingResult> {
  const detectedType = options.filename ? detectDocumentType(options.filename) : 'generic'

  // If already generic or forced, just process
  if (detectedType === 'generic' || options.forceSchema) {
    return processPDF(options)
  }

  try {
    // Try with detected schema first
    return await processPDF({ ...options, forceSchema: detectedType })
  } catch {
    console.log('[PDFProcessor]', {
      action: 'processPDFWithFallback',
      message: `${detectedType} extraction failed, falling back to generic`,
    })

    // Fall back to generic extraction
    return processPDF({ ...options, forceSchema: 'generic' })
  }
}

/**
 * Get the text extraction prompt based on document type.
 * Similar to vision prompt but optimized for pre-extracted text.
 */
function getTextExtractionPrompt(schemaType: 'pl' | 'payroll' | 'expense' | 'generic', extractedText: string): string {
  const basePrompt = `You are a financial document extraction expert. Analyze the following extracted text from a PDF document and extract structured data.

IMPORTANT INSTRUCTIONS:
- Extract ALL numeric values you can find
- Use negative numbers for expenses/costs
- If a value is not clearly present, omit it (don't guess)
- Dates should be in YYYY-MM-DD format
- Currency values should be plain numbers without symbols
- The text below was extracted from a PDF, so formatting may be imperfect

EXTRACTED TEXT:
${extractedText}

`

  switch (schemaType) {
    case 'pl':
      return basePrompt + `This appears to be a Profit & Loss (P&L) or Income Statement.

Focus on extracting:
- Revenue/Income totals and line items
- Expense categories and amounts
- Net income/profit
- Reporting period dates
- Company name if visible

Set documentType to 'pl', 'income_statement', or 'profit_loss' based on the document.`

    case 'payroll':
      return basePrompt + `This appears to be a Payroll document.

Focus on extracting:
- Pay period dates
- Employee names and roles
- Gross pay, taxes, benefits, net pay
- Total payroll amounts
- Employee count

Set documentType to 'payroll', 'payroll_summary', or 'payroll_report' based on the document.`

    case 'expense':
      return basePrompt + `This appears to be an Expense Report or Operating Expense document.

Focus on extracting:
- Expense category summaries with amounts (current period, prior period, YTD, budget, variance)
- Individual expense line items with date, vendor, description, category, amount, payment method
- Total expenses for the period
- Reporting period/month
- Company name if visible

Set documentType to 'expense_report', 'operating_expenses', or 'monthly_expenses' based on the document.`

    case 'generic':
    default:
      return basePrompt + `The document type is unknown.

Extract:
- Any structured financial data you can identify
- Tables as arrays of data
- Any numeric values with their labels

Set documentType to 'unknown'.`
  }
}

/**
 * Process a PDF using text extraction + GPT-4o text model.
 * This is faster than Vision API and works better for complex documents.
 *
 * @param options - Processing options including file buffer
 * @returns Structured extraction result
 * @throws Error if processing fails
 */
export async function processPDFWithTextExtraction(options: ProcessPDFOptions): Promise<PDFProcessingResult> {
  // Import dynamically to avoid circular dependencies
  const { extractPDFText } = await import('./pdf-text-extractor')

  const startTime = Date.now()

  // Ensure we have a Buffer
  const buffer = typeof options.file === 'string'
    ? Buffer.from(options.file, 'base64')
    : options.file

  // Extract text from PDF
  const textResult = await extractPDFText(buffer)

  if (!textResult.success || !textResult.text) {
    throw new Error(`Text extraction failed: ${textResult.error || 'No text extracted'}`)
  }

  console.log('[PDFProcessor]', {
    action: 'processPDFWithTextExtraction',
    textLength: textResult.text.length,
    pageCount: textResult.pageCount,
  })

  // Determine which schema to use
  const schemaType = options.forceSchema ?? (options.filename ? detectDocumentType(options.filename) : 'generic')

  // Select the appropriate schema
  const schema = schemaType === 'pl'
    ? plExtractionSchema
    : schemaType === 'payroll'
      ? payrollExtractionSchema
      : schemaType === 'expense'
        ? expenseExtractionSchema
        : genericExtractionSchema

  // Get extraction prompt with extracted text
  const prompt = getTextExtractionPrompt(schemaType, textResult.text)

  try {
    // Use GPT-4o (text model) for faster processing
    const { object: extractedData } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const processingTimeMs = Date.now() - startTime

    console.log('[PDFProcessor]', {
      action: 'processPDFWithTextExtraction',
      success: true,
      schemaType,
      processingTimeMs,
      method: 'text-extraction',
    })

    return {
      success: true,
      extractedData: extractedData as PLExtraction | PayrollExtraction | ExpenseExtraction | GenericExtraction,
      processingTimeMs,
      schemaUsed: schemaType,
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[PDFProcessor]', {
      action: 'processPDFWithTextExtraction',
      success: false,
      error: errorMessage,
      schemaType,
      processingTimeMs,
    })

    throw new Error(`PDF text extraction processing failed: ${errorMessage}`)
  }
}

/**
 * Process a PDF with automatic fallback to text extraction on timeout.
 * DEPRECATED: Use processPDFOptimized instead for better performance.
 *
 * Flow:
 * 1. Try Vision API with 90-second timeout
 * 2. If timeout, fall back to text extraction + GPT-4o
 * 3. If first schema fails, try generic schema
 *
 * @param options - Processing options
 * @returns Structured extraction result
 * @deprecated Use processPDFOptimized for text-first processing
 */
export async function processPDFWithAutoFallback(options: ProcessPDFOptions): Promise<PDFProcessingResult> {
  try {
    // First try Vision API (handles most documents well)
    return await processPDFWithFallback(options)
  } catch (error) {
    // Check if this was a timeout error
    if (error instanceof PDFProcessingTimeoutError) {
      console.log('[PDFProcessor]', {
        action: 'processPDFWithAutoFallback',
        message: 'Vision API timed out, falling back to text extraction',
      })

      // Fall back to text extraction method
      try {
        return await processPDFWithTextExtraction(options)
      } catch (textError) {
        // If text extraction also fails, throw a combined error with both details
        const textErrorMessage = textError instanceof Error ? textError.message : 'Unknown error'
        console.error('[PDFProcessor]', {
          action: 'processPDFWithAutoFallback',
          message: 'Text extraction fallback also failed',
          visionError: 'timeout',
          textExtractionError: textErrorMessage,
        })
        // Throw error with both failure details for better debugging
        throw new Error(`PDF processing failed: Vision API timed out, and text extraction fallback failed: ${textErrorMessage}`)
      }
    }

    // For non-timeout errors, rethrow
    throw error
  }
}

/** File size threshold for text-first processing (100KB) */
const TEXT_FIRST_SIZE_THRESHOLD = 100_000

/** Minimum extracted text length to consider text extraction successful */
const MIN_EXTRACTED_TEXT_LENGTH = 100

/**
 * Determine if text extraction should be tried first based on file size.
 * Small files (< 100KB) typically process faster with text extraction.
 *
 * @param fileSize - File size in bytes
 * @returns true if text extraction should be tried first
 */
export function shouldUseTextExtractionFirst(fileSize: number): boolean {
  return fileSize < TEXT_FIRST_SIZE_THRESHOLD
}

/**
 * Process a PDF with optimized flow - text extraction first for small files.
 * This is the RECOMMENDED entry point for PDF processing.
 *
 * Flow:
 * 1. For small files (< 100KB): Try text extraction first
 *    - If text content is sufficient (> 100 chars), process with GPT-4o
 *    - If text content is insufficient, fall back to Vision API
 * 2. For large files: Use Vision API with timeout fallback to text extraction
 *
 * @param options - Processing options including file buffer
 * @returns Structured extraction result
 */
export async function processPDFOptimized(options: ProcessPDFOptions): Promise<PDFProcessingResult> {
  // Get file size
  const fileSize = typeof options.file === 'string'
    ? Buffer.from(options.file, 'base64').length
    : options.file.length

  const useTextFirst = shouldUseTextExtractionFirst(fileSize)

  console.log('[PDFProcessor]', {
    action: 'processPDFOptimized',
    fileSize,
    useTextFirst,
    filename: options.filename,
  })

  if (useTextFirst) {
    // Small file: Try text extraction first
    try {
      // Import dynamically to avoid circular dependencies
      const { extractPDFText } = await import('./pdf-text-extractor')

      const buffer = typeof options.file === 'string'
        ? Buffer.from(options.file, 'base64')
        : options.file

      const textResult = await extractPDFText(buffer)

      // Check if we got sufficient text content
      if (textResult.success && textResult.text && textResult.text.length >= MIN_EXTRACTED_TEXT_LENGTH) {
        console.log('[PDFProcessor]', {
          action: 'processPDFOptimized',
          message: 'Using text extraction (sufficient content)',
          textLength: textResult.text.length,
        })

        // Process with text extraction path
        return await processPDFWithTextExtraction(options)
      }

      // Insufficient text - might be scanned PDF, fall back to Vision
      console.log('[PDFProcessor]', {
        action: 'processPDFOptimized',
        message: 'Text extraction insufficient, falling back to Vision API',
        textLength: textResult.text?.length ?? 0,
      })

      return await processPDFWithFallback(options)
    } catch (textError) {
      // Text extraction failed, try Vision API
      console.log('[PDFProcessor]', {
        action: 'processPDFOptimized',
        message: 'Text extraction failed, falling back to Vision API',
        error: textError instanceof Error ? textError.message : 'Unknown error',
      })

      return await processPDFWithFallback(options)
    }
  }

  // Large file: Use original Vision-first approach with timeout fallback
  return await processPDFWithAutoFallback(options)
}
