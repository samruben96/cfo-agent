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
  genericExtractionSchema,
} from './extraction-schemas'

import type {
  PLExtraction,
  PayrollExtraction,
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
  forceSchema?: 'pl' | 'payroll' | 'generic'
}

/**
 * PDF processing result.
 */
export interface PDFProcessingResult {
  success: boolean
  extractedData: PLExtraction | PayrollExtraction | GenericExtraction
  processingTimeMs: number
  schemaUsed: 'pl' | 'payroll' | 'generic'
}

/**
 * Detect document type from filename.
 * Returns the most likely schema to use based on filename patterns.
 */
export function detectDocumentType(filename: string): 'pl' | 'payroll' | 'generic' {
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

  return 'generic'
}

/**
 * Get the extraction prompt based on document type.
 */
function getExtractionPrompt(schemaType: 'pl' | 'payroll' | 'generic'): string {
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

/**
 * Process a PDF document using GPT-5.2 Vision API.
 *
 * @param options - Processing options including file and optional schema override
 * @returns Structured extraction result with timing information
 * @throws Error if processing fails
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

  try {
    // Call GPT-5.2 Vision API with structured output
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
    })

    const processingTimeMs = Date.now() - startTime

    console.log('[PDFProcessor]', {
      action: 'processPDF',
      success: true,
      schemaType,
      processingTimeMs,
    })

    return {
      success: true,
      extractedData: extractedData as PLExtraction | PayrollExtraction | GenericExtraction,
      processingTimeMs,
      schemaUsed: schemaType,
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
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
