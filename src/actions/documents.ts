'use server'

import { createClient } from '@/lib/supabase/server'

import { parseCSVString } from '@/lib/documents/csv-parser'
import { detectCSVType } from '@/lib/documents/csv-type-detector'
import { importCSVData } from '@/lib/documents/csv-importer'
import { processPDFWithFallback } from '@/lib/documents/pdf-processor'

import type { ActionResponse } from '@/types'
import type { Json } from '@/types/database'
import type { Document, DocumentRow, ParsedCSVData, CSVType } from '@/types/documents'
import { transformRowToDocument } from '@/types/documents'
import type { PDFProcessingResult } from '@/lib/documents/pdf-processor'

/**
 * Upload a document to Supabase Storage and create a database record.
 * Returns the created document.
 */
export async function uploadDocument(
  formData: FormData
): Promise<ActionResponse<Document>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[DocumentsService]', {
        action: 'uploadDocument',
        error: 'Not authenticated'
      })
      return { data: null, error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { data: null, error: 'No file provided' }
    }

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const supportedTypes = ['csv', 'pdf']
    if (!fileExt || !supportedTypes.includes(fileExt)) {
      return { data: null, error: 'Only CSV and PDF files are supported' }
    }

    // Determine MIME type
    const mimeType = fileExt === 'csv' ? 'text/csv' : 'application/pdf'

    // Create storage path: user_id/timestamp.extension
    const storagePath = `${user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file)

    if (uploadError) {
      console.error('[DocumentsService]', {
        action: 'uploadDocument',
        error: uploadError.message
      })
      return { data: null, error: 'Failed to upload file' }
    }

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_type: fileExt,
        file_size: file.size,
        mime_type: file.type || mimeType,
        storage_path: storagePath,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('[DocumentsService]', {
        action: 'uploadDocument',
        error: error.message
      })
      // Clean up uploaded file on failure
      await supabase.storage.from('documents').remove([storagePath])
      return { data: null, error: 'Failed to create document record' }
    }

    const transformed = transformRowToDocument(data as DocumentRow)
    console.log('[DocumentsService]', {
      action: 'uploadDocument',
      userId: user.id,
      documentId: transformed.id
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'uploadDocument',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to upload document' }
  }
}

/**
 * Process a CSV document by parsing its content and detecting type.
 * Returns the parsed data for preview.
 */
export async function processCSV(
  documentId: string
): Promise<ActionResponse<ParsedCSVData>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)
      .eq('user_id', user.id)

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return { data: null, error: 'Document not found' }
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      await updateDocumentError(supabase, documentId, user.id, 'Failed to download file')
      return { data: null, error: 'Failed to download file' }
    }

    // Convert Blob to string
    const csvString = await fileData.text()

    // Parse CSV
    const parseResult = parseCSVString(csvString)

    if (parseResult.error) {
      await updateDocumentError(supabase, documentId, user.id, parseResult.error)
      return { data: null, error: parseResult.error }
    }

    // Detect CSV type
    const detection = detectCSVType(parseResult.headers)

    const parsedData: ParsedCSVData = {
      headers: parseResult.headers,
      rows: parseResult.data.slice(0, 100), // Limit for preview
      totalRows: parseResult.data.length,
      detectedType: detection.type,
      confidence: detection.confidence
    }

    // Update document with parsed data
    await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        csv_type: detection.type,
        extracted_data: {
          headers: parseResult.headers,
          preview: parseResult.data.slice(0, 10)
        } as unknown as Json,
        row_count: parseResult.data.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', user.id)

    console.log('[DocumentsService]', {
      action: 'processCSV',
      documentId,
      detectedType: detection.type,
      rowCount: parseResult.data.length
    })

    return { data: parsedData, error: null }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'processCSV',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to process CSV' }
  }
}

/**
 * Process a PDF document using GPT-5.2 Vision API.
 * Extracts structured financial data and returns the result.
 */
export async function processPDF(
  documentId: string
): Promise<ActionResponse<PDFProcessingResult>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)
      .eq('user_id', user.id)

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return { data: null, error: 'Document not found' }
    }

    // Verify it's a PDF
    if (doc.file_type !== 'pdf') {
      return { data: null, error: 'Document is not a PDF' }
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      await updateDocumentError(supabase, documentId, user.id, 'Failed to download file')
      return { data: null, error: 'Failed to download file' }
    }

    // Convert Blob to Buffer for processing
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process PDF with Vision API
    const result = await processPDFWithFallback({
      file: buffer,
      filename: doc.filename
    })

    // Update document with extracted data
    await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        extracted_data: result.extractedData as unknown as Json,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', user.id)

    console.log('[DocumentsService]', {
      action: 'processPDF',
      documentId,
      schemaUsed: result.schemaUsed,
      processingTimeMs: result.processingTimeMs
    })

    return { data: result, error: null }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    console.error('[DocumentsService]', {
      action: 'processPDF',
      error: errorMessage
    })

    // Try to update document with error status
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await updateDocumentError(supabase, documentId, user.id, errorMessage)
      }
    } catch {
      // Ignore cleanup errors
    }

    return { data: null, error: 'Failed to process PDF' }
  }
}

/**
 * Confirm CSV import, save column mappings, and import data to target tables.
 */
export async function confirmCSVImport(
  documentId: string,
  mappings: Record<string, string>,
  csvType?: CSVType
): Promise<ActionResponse<Document>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get document with extracted data for import
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return { data: null, error: 'Document not found' }
    }

    // Get full CSV data for import (need to re-parse the file)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      return { data: null, error: 'Failed to download file for import' }
    }

    const csvString = await fileData.text()
    const parseResult = parseCSVString(csvString)

    if (parseResult.error) {
      return { data: null, error: parseResult.error }
    }

    // Import data to target tables
    // Use passed csvType if provided (from user selection), otherwise fall back to detected type
    const finalCsvType = csvType || (doc.csv_type as CSVType) || 'unknown'
    const importResult = await importCSVData({
      userId: user.id,
      csvType: finalCsvType,
      mappings,
      data: parseResult.data
    })

    // Update document with confirmed mappings, correct type, and import result
    const { data, error } = await supabase
      .from('documents')
      .update({
        csv_type: finalCsvType,
        column_mappings: mappings,
        processing_status: importResult.success ? 'completed' : 'error',
        error_message: importResult.success ? null : importResult.errors.join('; ')
      })
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[DocumentsService]', {
        action: 'confirmCSVImport',
        error: error.message
      })
      return { data: null, error: 'Failed to confirm import' }
    }

    console.log('[DocumentsService]', {
      action: 'confirmCSVImport',
      documentId,
      csvType: finalCsvType,
      rowsImported: importResult.rowsImported,
      rowsSkipped: importResult.rowsSkipped
    })

    // Return success even if some rows failed (partial import is ok)
    if (!importResult.success && importResult.rowsImported === 0) {
      return { data: transformRowToDocument(data as DocumentRow), error: importResult.errors[0] || 'Import failed' }
    }

    return { data: transformRowToDocument(data as DocumentRow), error: null }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'confirmCSVImport',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to confirm import' }
  }
}

/**
 * Fetch all documents for the current user.
 */
export async function getDocuments(): Promise<ActionResponse<Document[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[DocumentsService]', {
        action: 'getDocuments',
        error: 'Not authenticated'
      })
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DocumentsService]', {
        action: 'getDocuments',
        error: error.message
      })
      return { data: null, error: 'Failed to load documents' }
    }

    const transformed = (data as DocumentRow[]).map(transformRowToDocument)
    console.log('[DocumentsService]', {
      action: 'getDocuments',
      userId: user.id,
      count: transformed.length
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'getDocuments',
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: 'Failed to load documents' }
  }
}

/**
 * Delete a document and its associated storage file.
 */
export async function deleteDocument(
  documentId: string
): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[DocumentsService]', {
        action: 'deleteDocument',
        error: 'Not authenticated'
      })
      return { data: null, error: 'Not authenticated' }
    }

    // Get document to find storage path
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return { data: null, error: 'Document not found' }
    }

    // Delete from storage
    await supabase.storage.from('documents').remove([doc.storage_path])

    // Delete record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DocumentsService]', {
        action: 'deleteDocument',
        error: error.message,
        documentId
      })
      return { data: null, error: 'Failed to delete document' }
    }

    console.log('[DocumentsService]', {
      action: 'deleteDocument',
      userId: user.id,
      documentId
    })
    return { data: { deleted: true }, error: null }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'deleteDocument',
      error: e instanceof Error ? e.message : 'Unknown error',
      documentId
    })
    return { data: null, error: 'Failed to delete document' }
  }
}

/**
 * Get document data for viewing.
 * Re-parses the document from storage to get all rows.
 */
export async function getDocumentData(
  documentId: string
): Promise<ActionResponse<{ headers: string[]; rows: Record<string, unknown>[]; totalRows: number }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return { data: null, error: 'Document not found' }
    }

    // Handle PDF documents - return extracted data
    if (doc.file_type === 'pdf') {
      const extractedData = doc.extracted_data as Record<string, unknown> | null
      if (!extractedData) {
        return { data: null, error: 'No extracted data available' }
      }

      // Convert PDF extracted data to table format
      // PDFs typically have line_items array
      const lineItems = (extractedData.line_items || extractedData.lineItems || []) as Record<string, unknown>[]
      if (lineItems.length === 0) {
        // Try to show summary data
        const summaryKeys = Object.keys(extractedData).filter(k => k !== 'documentType')
        return {
          data: {
            headers: ['Field', 'Value'],
            rows: summaryKeys.map(key => ({ Field: key, Value: JSON.stringify(extractedData[key]) })),
            totalRows: summaryKeys.length
          },
          error: null
        }
      }

      const headers = Object.keys(lineItems[0] || {})
      return {
        data: {
          headers,
          rows: lineItems,
          totalRows: lineItems.length
        },
        error: null
      }
    }

    // Handle CSV documents - re-parse from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      return { data: null, error: 'Failed to download file' }
    }

    const csvString = await fileData.text()
    const parseResult = parseCSVString(csvString)

    if (parseResult.error) {
      return { data: null, error: parseResult.error }
    }

    // Limit to first 500 rows for performance
    const maxRows = 500
    const rows = parseResult.data.slice(0, maxRows)

    console.log('[DocumentsService]', {
      action: 'getDocumentData',
      documentId,
      rowsReturned: rows.length,
      totalRows: parseResult.data.length
    })

    return {
      data: {
        headers: parseResult.headers,
        rows,
        totalRows: parseResult.data.length
      },
      error: null
    }
  } catch (e) {
    console.error('[DocumentsService]', {
      action: 'getDocumentData',
      error: e instanceof Error ? e.message : 'Unknown error',
      documentId
    })
    return { data: null, error: 'Failed to load document data' }
  }
}

/**
 * Helper function to update document with error status.
 */
async function updateDocumentError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  userId: string,
  errorMessage: string
) {
  await supabase
    .from('documents')
    .update({
      processing_status: 'error',
      error_message: errorMessage
    })
    .eq('id', documentId)
    .eq('user_id', userId)
}
