/**
 * PDF text extractor using pdf-parse.
 * Story: 3.5.5 PDF Table Extraction Preprocessing
 *
 * Extracts raw text from PDF documents without using Vision API.
 * This is used as a preprocessing step for complex documents that
 * would otherwise timeout with Vision API processing.
 *
 * Note: We use pdf-parse instead of unpdf because unpdf has compatibility
 * issues with Node.js 22 (Buffer transfer in worker threads).
 *
 * @see https://www.npmjs.com/package/pdf-parse
 */

import pdfParse from 'pdf-parse'

/**
 * Result of PDF text extraction.
 */
export interface PDFTextExtractionResult {
  /** Whether extraction was successful */
  success: boolean
  /** Extracted text content */
  text: string
  /** Text content split by page */
  pageTexts: string[]
  /** Number of pages in the PDF */
  pageCount: number
  /** Processing time in milliseconds */
  processingTimeMs: number
  /** Error message if extraction failed */
  error?: string
}

/**
 * Extract text content from a PDF buffer.
 * Uses pdf-parse which is stable with Node.js 22.
 *
 * @param pdfBuffer - PDF file as Buffer
 * @returns Extraction result with text content
 *
 * @example
 * ```ts
 * const result = await extractPDFText(pdfBuffer)
 * if (result.success) {
 *   console.log('Extracted text:', result.text)
 *   console.log('Pages:', result.pageCount)
 * }
 * ```
 */
export async function extractPDFText(
  pdfBuffer: Buffer
): Promise<PDFTextExtractionResult> {
  const startTime = Date.now()

  try {
    // Use pdf-parse to extract text content
    const data = await pdfParse(pdfBuffer)
    const pageCount = data.numpages
    const text = data.text

    console.log('[PDFTextExtractor]', {
      action: 'extractPDFText',
      pageCount,
    })

    const processingTimeMs = Date.now() - startTime

    console.log('[PDFTextExtractor]', {
      action: 'extractPDFText',
      success: true,
      pageCount,
      textLength: text.length,
      processingTimeMs,
    })

    // pdf-parse doesn't provide per-page text, so we use the full text
    return {
      success: true,
      text,
      pageTexts: [text],
      pageCount,
      processingTimeMs,
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[PDFTextExtractor]', {
      action: 'extractPDFText',
      success: false,
      error: errorMessage,
      processingTimeMs,
    })

    return {
      success: false,
      text: '',
      pageTexts: [],
      pageCount: 0,
      processingTimeMs,
      error: errorMessage,
    }
  }
}

/**
 * Check if extracted text appears to contain tabular data.
 * Uses heuristics to detect table-like structures.
 *
 * @param text - Extracted text content
 * @returns true if text appears to contain tables
 */
export function detectTabularContent(text: string): boolean {
  // Heuristics for detecting table content:
  // 1. Multiple lines with similar structure (repeated delimiters)
  // 2. Presence of column-like patterns
  // 3. Numeric data in regular patterns

  const lines = text.split('\n').filter(line => line.trim().length > 0)

  if (lines.length < 3) return false

  // Check for consistent delimiter patterns
  const tabDelimited = lines.filter(line => line.includes('\t')).length
  const commaDelimited = lines.filter(line => (line.match(/,/g) || []).length > 2).length
  const spaceDelimited = lines.filter(line => (line.match(/\s{2,}/g) || []).length > 2).length

  // If more than 30% of lines have consistent delimiters, likely tabular
  const tableThreshold = lines.length * 0.3
  if (tabDelimited > tableThreshold || commaDelimited > tableThreshold || spaceDelimited > tableThreshold) {
    return true
  }

  // Check for numeric patterns (common in financial tables)
  const numericLines = lines.filter(line => {
    const numbers = line.match(/[\d,]+\.?\d*/g) || []
    return numbers.length >= 3
  }).length

  // If more than 20% of lines have multiple numbers, likely tabular
  if (numericLines > lines.length * 0.2) {
    return true
  }

  return false
}
