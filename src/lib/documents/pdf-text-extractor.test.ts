/**
 * Tests for PDF text extractor.
 * Story: 3.5.5 PDF Table Extraction Preprocessing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import { extractPDFText, detectTabularContent } from './pdf-text-extractor'

// Mock pdf-parse module
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}))

import pdfParse from 'pdf-parse'
const mockPdfParse = vi.mocked(pdfParse)

describe('extractPDFText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts text from PDF successfully', async () => {
    mockPdfParse.mockResolvedValueOnce({
      numpages: 2,
      text: 'Page 1 content\nPage 2 content',
      numrender: 2,
      info: {},
      metadata: null,
      version: '1.0',
    } as never)

    const result = await extractPDFText(Buffer.from('mock pdf content'))

    expect(result.success).toBe(true)
    expect(result.text).toBe('Page 1 content\nPage 2 content')
    expect(result.pageCount).toBe(2)
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns error when extraction fails', async () => {
    mockPdfParse.mockRejectedValueOnce(new Error('Invalid PDF'))

    const result = await extractPDFText(Buffer.from('invalid content'))

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid PDF')
    expect(result.text).toBe('')
    expect(result.pageCount).toBe(0)
  })

  it('handles empty PDF gracefully', async () => {
    mockPdfParse.mockResolvedValueOnce({
      numpages: 0,
      text: '',
      numrender: 0,
      info: {},
      metadata: null,
      version: '1.0',
    } as never)

    const result = await extractPDFText(Buffer.from('empty pdf'))

    expect(result.success).toBe(true)
    expect(result.text).toBe('')
    expect(result.pageCount).toBe(0)
  })
})

describe('detectTabularContent', () => {
  it('detects tab-delimited content', () => {
    const text = `Name\tAge\tSalary
John\t30\t50000
Jane\t25\t45000
Bob\t35\t60000`

    expect(detectTabularContent(text)).toBe(true)
  })

  it('detects comma-delimited content', () => {
    const text = `Name, Department, Salary, Start Date
John Smith, Engineering, 75000, 2020-01-15
Jane Doe, Marketing, 65000, 2019-06-01
Bob Wilson, Sales, 80000, 2018-03-20`

    expect(detectTabularContent(text)).toBe(true)
  })

  it('detects content with multiple numbers per line (financial data)', () => {
    const text = `Q1 Revenue: 100,000.00  Q2 Revenue: 110,000.00  Q3 Revenue: 95,000.00
Q1 Expenses: 75,000.00  Q2 Expenses: 80,000.00  Q3 Expenses: 70,000.00
Q1 Net: 25,000.00  Q2 Net: 30,000.00  Q3 Net: 25,000.00
Total Revenue: 305,000.00  Total Expenses: 225,000.00  Total Net: 80,000.00`

    expect(detectTabularContent(text)).toBe(true)
  })

  it('returns false for simple text without tables', () => {
    const text = `This is a paragraph of text.
It continues on multiple lines.
But there are no tables here.`

    expect(detectTabularContent(text)).toBe(false)
  })

  it('returns false for very short content', () => {
    const text = `Short content`

    expect(detectTabularContent(text)).toBe(false)
  })

  it('returns false for empty content', () => {
    expect(detectTabularContent('')).toBe(false)
  })
})
