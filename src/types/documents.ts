/**
 * Document types for CSV and PDF file uploads.
 * Story: 3.3 CSV File Upload
 * Story: 3.4 PDF Document Upload
 */

// Re-export extraction schema types for convenience
export type {
  PLExtraction,
  PayrollExtraction,
  GenericExtraction
} from '@/lib/documents/extraction-schemas'

// Re-export PDF processor types
export type { PDFProcessingResult } from '@/lib/documents/pdf-processor'

// Processing status for document upload and parsing
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error'

// Supported CSV types for detection and mapping
export type CSVType = 'pl' | 'payroll' | 'employees' | 'unknown'

// PDF document schema types detected during extraction
export type PDFSchemaType = 'pl' | 'payroll' | 'generic'

// PDF document type strings returned from extraction
export type PDFDocumentType =
  | 'pl'
  | 'income_statement'
  | 'profit_loss'
  | 'payroll'
  | 'payroll_summary'
  | 'payroll_report'
  | 'unknown'

/**
 * Document interface for application use (camelCase).
 * Transformed from database row format.
 */
export interface Document {
  id: string
  userId: string
  filename: string
  fileType: 'csv' | 'pdf'
  fileSize: number
  mimeType: string
  storagePath: string
  processingStatus: ProcessingStatus
  csvType?: CSVType
  extractedData?: Record<string, unknown>
  rowCount?: number
  columnMappings?: Record<string, string>
  errorMessage?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
}

/**
 * Database row format for documents table (snake_case).
 * Used directly with Supabase queries.
 */
export interface DocumentRow {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  mime_type: string
  storage_path: string
  processing_status: string
  csv_type: string | null
  extracted_data: Record<string, unknown> | null
  row_count: number | null
  column_mappings: Record<string, string> | null
  error_message: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
}

/**
 * Data structure for parsed CSV file preview.
 */
export interface ParsedCSVData {
  headers: string[]
  rows: Record<string, unknown>[]
  totalRows: number
  detectedType: CSVType
  confidence: number // 0-1
}

/**
 * Column mapping configuration for CSV import.
 */
export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  required: boolean
}

/**
 * Upload state for document drop zone component.
 */
export interface DocumentUploadData {
  file: File | null
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  error?: string
  documentId?: string
}

// Target field options per CSV type
export const PL_TARGET_FIELDS = [
  'revenue',
  'expense_category',
  'expense_amount',
  'date',
  'description',
  'ignore'
] as const

export const PAYROLL_TARGET_FIELDS = [
  'employee_name',
  'employee_id',
  'hours_worked',
  'hourly_rate',
  'gross_pay',
  'net_pay',
  'pay_date',
  'ignore'
] as const

export const EMPLOYEE_TARGET_FIELDS = [
  'name',
  'employee_id',
  'role',
  'department',
  'annual_salary',
  'annual_benefits',
  'employment_type',
  'ignore'
] as const

// Type-safe target field types
export type PLTargetField = typeof PL_TARGET_FIELDS[number]
export type PayrollTargetField = typeof PAYROLL_TARGET_FIELDS[number]
export type EmployeeTargetField = typeof EMPLOYEE_TARGET_FIELDS[number]

/**
 * Get target fields for a given CSV type.
 */
export function getTargetFieldsForCSVType(csvType: CSVType): readonly string[] {
  switch (csvType) {
    case 'pl':
      return PL_TARGET_FIELDS
    case 'payroll':
      return PAYROLL_TARGET_FIELDS
    case 'employees':
      return EMPLOYEE_TARGET_FIELDS
    default:
      return []
  }
}

/**
 * Get PDF schema type from extracted data.
 * Returns the schema type based on documentType in extracted data.
 */
export function getPDFSchemaType(extractedData: Record<string, unknown> | undefined): PDFSchemaType | null {
  if (!extractedData) return null
  const docType = extractedData.documentType as PDFDocumentType | undefined
  if (!docType) return null

  if (docType === 'pl' || docType === 'income_statement' || docType === 'profit_loss') {
    return 'pl'
  }
  if (docType === 'payroll' || docType === 'payroll_summary' || docType === 'payroll_report') {
    return 'payroll'
  }
  return 'generic'
}

/**
 * Get human-readable label for PDF schema type.
 */
export function getPDFSchemaLabel(schemaType: PDFSchemaType | null): string | null {
  switch (schemaType) {
    case 'pl':
      return 'P&L Statement'
    case 'payroll':
      return 'Payroll Report'
    case 'generic':
      return 'Document'
    default:
      return null
  }
}

/**
 * Transform database row to Document interface.
 */
export function transformRowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    fileType: row.file_type as 'csv' | 'pdf',
    fileSize: row.file_size,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    processingStatus: row.processing_status as ProcessingStatus,
    csvType: row.csv_type as CSVType | undefined,
    extractedData: row.extracted_data ?? undefined,
    rowCount: row.row_count ?? undefined,
    columnMappings: row.column_mappings ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at ?? undefined
  }
}
