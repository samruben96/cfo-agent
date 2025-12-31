/**
 * Unit tests for documents server actions.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Track all mock calls for debugging
let mockState = {
  getUser: null as { data: { user: object | null }; error: object | null } | null,
  fromCalls: [] as string[],
  selectData: [] as object[],
  insertData: null as object | null,
  updateData: null as object | null,
  deleteError: null as object | null,
  storageDownload: null as { data: Blob | null; error: object | null } | null
}

// Create mock functions
const mockGetUser = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageDownload = vi.fn()
const mockStorageRemove = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => {
    // Create a query builder that tracks state
    const createQueryBuilder = () => {
      const builder = {
        select: vi.fn().mockImplementation(() => builder),
        insert: vi.fn().mockImplementation(() => builder),
        update: vi.fn().mockImplementation(() => builder),
        delete: vi.fn().mockImplementation(() => builder),
        eq: vi.fn().mockImplementation(() => builder),
        order: vi.fn().mockImplementation(() => {
          // Return data for getDocuments
          if (mockState.selectData.length > 0) {
            return { data: mockState.selectData, error: null }
          }
          return { data: [], error: null }
        }),
        single: vi.fn().mockImplementation(async () => {
          if (mockState.insertData) {
            return { data: mockState.insertData, error: null }
          }
          if (mockState.updateData) {
            return { data: mockState.updateData, error: null }
          }
          // For select by ID (like in confirmCSVImport), return first selectData item
          if (mockState.selectData.length > 0) {
            return { data: mockState.selectData[0], error: null }
          }
          return { data: null, error: mockState.deleteError || { message: 'Not found' } }
        })
      }
      return builder
    }

    return Promise.resolve({
      auth: {
        getUser: mockGetUser
      },
      from: vi.fn().mockImplementation(() => createQueryBuilder()),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockStorageUpload,
          download: mockStorageDownload,
          remove: mockStorageRemove
        })
      }
    })
  })
}))

// Mock CSV parser
vi.mock('@/lib/documents/csv-parser', () => ({
  parseCSVString: vi.fn(() => ({
    data: [
      { name: 'Test', value: 100 },
      { name: 'Test2', value: 200 }
    ],
    headers: ['name', 'value'],
    error: null
  }))
}))

// Mock CSV type detector
vi.mock('@/lib/documents/csv-type-detector', () => ({
  detectCSVType: vi.fn(() => ({
    type: 'employees',
    confidence: 0.8,
    matchedColumns: ['name']
  }))
}))

// Mock CSV importer
vi.mock('@/lib/documents/csv-importer', () => ({
  importCSVData: vi.fn(() => ({
    success: true,
    rowsImported: 2,
    rowsSkipped: 0,
    errors: []
  }))
}))

// Mock PDF processor
vi.mock('@/lib/documents/pdf-processor', () => ({
  processPDFWithAutoFallback: vi.fn(() => ({
    success: true,
    extractedData: {
      documentType: 'pl',
      revenue: { total: 100000 },
      expenses: { total: 75000 },
      netIncome: 25000
    },
    processingTimeMs: 2500,
    schemaUsed: 'pl'
  })),
  PDFProcessingTimeoutError: class PDFProcessingTimeoutError extends Error {
    constructor(timeoutMs: number) {
      super(`PDF processing timed out after ${timeoutMs / 1000} seconds`)
      this.name = 'PDFProcessingTimeoutError'
    }
  }
}))

// Import after mocking
import {
  uploadDocument,
  getDocuments,
  confirmCSVImport,
  processPDF
} from './documents'

describe('documents actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset state
    mockState = {
      getUser: null,
      fromCalls: [],
      selectData: [],
      insertData: null,
      updateData: null,
      deleteError: null,
      storageDownload: null
    }

    mockStorageUpload.mockResolvedValue({ error: null })
    mockStorageRemove.mockResolvedValue({ error: null })
    mockStorageDownload.mockResolvedValue({
      data: new Blob(['name,value\nTest,100']),
      error: null
    })
  })

  describe('getDocuments', () => {
    it('returns documents for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockState.selectData = [
        {
          id: 'doc-1',
          user_id: 'user-123',
          filename: 'test.csv',
          file_type: 'csv',
          file_size: 1000,
          mime_type: 'text/csv',
          storage_path: 'user-123/123.csv',
          processing_status: 'completed',
          csv_type: 'employees',
          extracted_data: null,
          row_count: 10,
          column_mappings: null,
          error_message: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          processed_at: null
        }
      ]

      const result = await getDocuments()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].filename).toBe('test.csv')
      expect(result.data?.[0].processingStatus).toBe('completed')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await getDocuments()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('returns empty array when no documents exist', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockState.selectData = []

      const result = await getDocuments()

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })
  })

  describe('uploadDocument', () => {
    it('uploads file and creates document record', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockStorageUpload.mockResolvedValue({ error: null })
      mockState.insertData = {
        id: 'doc-1',
        user_id: 'user-123',
        filename: 'test.csv',
        file_type: 'csv',
        file_size: 100,
        mime_type: 'text/csv',
        storage_path: 'user-123/123.csv',
        processing_status: 'pending',
        csv_type: null,
        extracted_data: null,
        row_count: null,
        column_mappings: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        processed_at: null
      }

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.csv', { type: 'text/csv' }))

      const result = await uploadDocument(formData)

      expect(result.error).toBeNull()
      expect(result.data?.filename).toBe('test.csv')
      expect(result.data?.processingStatus).toBe('pending')
      expect(mockStorageUpload).toHaveBeenCalled()
    })

    it('returns error when no file provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()

      const result = await uploadDocument(formData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('No file provided')
    })

    it('returns error for unsupported file types', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))

      const result = await uploadDocument(formData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Only CSV and PDF files are supported')
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.csv', { type: 'text/csv' }))

      const result = await uploadDocument(formData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('confirmCSVImport', () => {
    it('imports data and saves column mappings', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // First call is select to get document, second call is update
      const docData = {
        id: 'doc-1',
        user_id: 'user-123',
        filename: 'test.csv',
        file_type: 'csv',
        file_size: 100,
        mime_type: 'text/csv',
        storage_path: 'user-123/123.csv',
        processing_status: 'completed',
        csv_type: 'employees',
        extracted_data: null,
        row_count: 10,
        column_mappings: { name: 'name', value: 'annual_salary' },
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        processed_at: null
      }

      // Set up both select and update to return the same doc
      mockState.selectData = [docData]
      mockState.updateData = docData

      // Mock storage download to return CSV content (mock blob with text method)
      const mockBlob = {
        text: () => Promise.resolve('name,value\nTest,100')
      }
      mockStorageDownload.mockResolvedValue({
        data: mockBlob,
        error: null
      })

      const mappings = { name: 'name', value: 'annual_salary' }
      const result = await confirmCSVImport('doc-1', mappings)

      expect(result.error).toBeNull()
      expect(result.data?.columnMappings).toEqual(mappings)
    })

    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await confirmCSVImport('doc-1', { name: 'name' })

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('processPDF', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await processPDF('doc-1')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('returns error when document not found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockState.selectData = []

      const result = await processPDF('doc-1')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Document not found')
    })

    it('returns error when document is not a PDF', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockState.selectData = [{
        id: 'doc-1',
        user_id: 'user-123',
        filename: 'test.csv',
        file_type: 'csv',
        file_size: 1000,
        mime_type: 'text/csv',
        storage_path: 'user-123/123.csv',
        processing_status: 'pending',
        csv_type: null,
        extracted_data: null,
        row_count: null,
        column_mappings: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        processed_at: null
      }]

      const result = await processPDF('doc-1')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Document is not a PDF')
    })

    it('processes PDF and returns extraction result', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockState.selectData = [{
        id: 'doc-1',
        user_id: 'user-123',
        filename: 'test.pdf',
        file_type: 'pdf',
        file_size: 5000,
        mime_type: 'application/pdf',
        storage_path: 'user-123/123.pdf',
        processing_status: 'pending',
        csv_type: null,
        extracted_data: null,
        row_count: null,
        column_mappings: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        processed_at: null
      }]

      // Mock PDF file download
      const mockPDFBlob = {
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      }
      mockStorageDownload.mockResolvedValue({
        data: mockPDFBlob,
        error: null
      })

      const result = await processPDF('doc-1')

      expect(result.error).toBeNull()
      expect(result.data?.success).toBe(true)
      expect(result.data?.schemaUsed).toBe('pl')
      expect(result.data?.extractedData).toHaveProperty('revenue')
    })
  })
})
