/**
 * CSV parsing utilities using PapaParse.
 * Story: 3.3 CSV File Upload
 */
import Papa from 'papaparse'

import type { ParseResult } from 'papaparse'

export interface CSVParseOptions {
  header?: boolean
  dynamicTyping?: boolean
  preview?: number
}

export interface CSVParseResult<T = Record<string, unknown>> {
  data: T[]
  headers: string[]
  error: string | null
}

/**
 * Parse a CSV file asynchronously.
 * Returns parsed data with headers and any error encountered.
 */
export async function parseCSV<T extends Record<string, unknown>>(
  file: File,
  options: CSVParseOptions = {}
): Promise<CSVParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(file, {
      header: options.header ?? true,
      dynamicTyping: options.dynamicTyping ?? true,
      preview: options.preview, // Limit rows for preview
      skipEmptyLines: true,
      complete: (results: ParseResult<T>) => {
        if (results.errors.length > 0) {
          const errorMsg = results.errors[0].message
          console.error('[CSVParser]', { error: errorMsg })
          resolve({ data: [], headers: [], error: errorMsg })
          return
        }

        const headers = results.meta.fields ?? []
        console.log('[CSVParser]', {
          action: 'parseComplete',
          rows: results.data.length,
          headers: headers.length
        })

        resolve({ data: results.data, headers, error: null })
      },
      error: (error: Error) => {
        console.error('[CSVParser]', { error: error.message })
        resolve({ data: [], headers: [], error: error.message })
      }
    })
  })
}

/**
 * Parse a CSV string synchronously.
 * Useful for processing downloaded file content from Supabase Storage.
 */
export function parseCSVString<T extends Record<string, unknown>>(
  csvString: string,
  options: CSVParseOptions = {}
): CSVParseResult<T> {
  const results = Papa.parse<T>(csvString, {
    header: options.header ?? true,
    dynamicTyping: options.dynamicTyping ?? true,
    preview: options.preview,
    skipEmptyLines: true
  })

  if (results.errors.length > 0) {
    console.error('[CSVParser]', { error: results.errors[0].message })
    return { data: [], headers: [], error: results.errors[0].message }
  }

  console.log('[CSVParser]', {
    action: 'parseStringComplete',
    rows: results.data.length,
    headers: (results.meta.fields ?? []).length
  })

  return {
    data: results.data,
    headers: results.meta.fields ?? [],
    error: null
  }
}

/**
 * Validate CSV file before parsing.
 * Returns error message if invalid, null if valid.
 */
export function validateCSVFile(file: File, maxSizeMB: number = 10): string | null {
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'csv') {
    return 'Invalid file type. Please upload a CSV file.'
  }

  // Check MIME type (browsers report various MIME types for CSV)
  const validMimeTypes = [
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.ms-excel'
  ]
  if (!validMimeTypes.includes(file.type) && file.type !== '') {
    // Some browsers don't set type for CSV, so allow empty type
    return 'Invalid file type. Please upload a CSV file.'
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return `File too large. Maximum size is ${maxSizeMB}MB.`
  }

  // Check file is not empty
  if (file.size === 0) {
    return 'File is empty. Please upload a CSV with data.'
  }

  return null
}
