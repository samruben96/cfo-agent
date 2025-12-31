'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentDropZone } from './DocumentDropZone'
import { DocumentList } from './DocumentList'
import { CSVPreview } from './CSVPreview'
import { CSVMappingDialog } from './CSVMappingDialog'
import { PDFExtractionPreview } from './PDFExtractionPreview'
import { DocumentDataModal } from './DocumentDataModal'
import { uploadDocument, processCSV, processPDF, deleteDocument, confirmCSVImport } from '@/actions/documents'

import type { Document, ParsedCSVData, CSVType } from '@/types/documents'
import type { PDFProcessingResult } from '@/lib/documents/pdf-processor'

export type FileTypeFilter = 'all' | 'csv' | 'pdf'

interface DocumentsClientProps {
  initialDocuments: Document[]
}

export function DocumentsClient({ initialDocuments }: DocumentsClientProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [isPending, startTransition] = useTransition()
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all')

  // Upload and processing state
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null)
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // PDF processing state
  const [pdfResult, setPdfResult] = useState<PDFProcessingResult | null>(null)
  const [isSavingPDF, setIsSavingPDF] = useState(false)
  const [isProcessingPDF, setIsProcessingPDF] = useState(false)

  // View data modal state
  const [viewDocument, setViewDocument] = useState<Document | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // Filtered documents based on file type filter
  const filteredDocuments = useMemo(() => {
    if (fileTypeFilter === 'all') return documents
    return documents.filter((doc) => doc.fileType === fileTypeFilter)
  }, [documents, fileTypeFilter])

  // Count documents by type for filter badges
  const documentCounts = useMemo(() => ({
    all: documents.length,
    csv: documents.filter((d) => d.fileType === 'csv').length,
    pdf: documents.filter((d) => d.fileType === 'pdf').length,
  }), [documents])

  const handleFileSelect = useCallback(async (file: File) => {
    // Create FormData for upload
    const formData = new FormData()
    formData.append('file', file)

    // Upload file
    const { data: document, error: uploadError } = await uploadDocument(formData)

    if (uploadError || !document) {
      toast.error(uploadError || 'Failed to upload file')
      throw new Error(uploadError || 'Upload failed')
    }

    // Add to documents list
    setDocuments((prev) => [document, ...prev])
    setCurrentDocument(document)

    // Determine file type and process accordingly
    const isPDF = file.name.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      // Process PDF with Vision API
      setIsProcessingPDF(true)
      toast.info('Processing PDF... Complex documents may take 2-3 minutes.', {
        duration: 10000,
        id: 'pdf-processing',
      })
      const { data: result, error: processError } = await processPDF(document.id)
      setIsProcessingPDF(false)
      toast.dismiss('pdf-processing')

      if (processError || !result) {
        toast.error(processError || 'Failed to process PDF')
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === document.id
              ? { ...d, processingStatus: 'error' as const, errorMessage: processError || undefined }
              : d
          )
        )
        throw new Error(processError || 'Processing failed')
      }

      // Show PDF preview
      setPdfResult(result)

      // Update document in list with processed status
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === document.id
            ? {
                ...d,
                processingStatus: 'completed',
                extractedData: result.extractedData
              }
            : d
        )
      )

      toast.success(`PDF processed successfully (${result.schemaUsed === 'pl' ? 'P&L' : result.schemaUsed === 'payroll' ? 'Payroll' : 'Document'} detected)`)
    } else {
      // Process CSV
      const { data: parsed, error: processError } = await processCSV(document.id)

      if (processError || !parsed) {
        toast.error(processError || 'Failed to process CSV')
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === document.id
              ? { ...d, processingStatus: 'error' as const, errorMessage: processError || undefined }
              : d
          )
        )
        throw new Error(processError || 'Processing failed')
      }

      // Show preview
      setParsedData(parsed)

      // Update document in list with processed status
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === document.id
            ? {
                ...d,
                processingStatus: 'completed',
                csvType: parsed.detectedType,
                rowCount: parsed.totalRows
              }
            : d
        )
      )

      toast.success('CSV processed successfully')
    }
  }, [])

  const handlePreviewConfirm = useCallback(() => {
    if (!parsedData || parsedData.detectedType === 'unknown') {
      toast.error('Please select a CSV type before continuing')
      return
    }
    setShowMappingDialog(true)
  }, [parsedData])

  const handlePreviewCancel = useCallback(() => {
    setParsedData(null)
    setCurrentDocument(null)
  }, [])

  const handleTypeChange = useCallback((newType: CSVType) => {
    if (parsedData) {
      setParsedData({
        ...parsedData,
        detectedType: newType,
        confidence: 1.0 // User selected, so 100% confidence
      })
    }
  }, [parsedData])

  const handleMappingConfirm = useCallback(
    async (mappings: Record<string, string>) => {
      if (!currentDocument || !parsedData) return

      setIsImporting(true)
      try {
        const { error } = await confirmCSVImport(currentDocument.id, mappings, parsedData.detectedType)

        if (error) {
          toast.error(error)
          return
        }

        // Update document with mappings
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === currentDocument.id
              ? { ...d, columnMappings: mappings }
              : d
          )
        )

        toast.success('Data imported successfully')
        setShowMappingDialog(false)
        setParsedData(null)
        setCurrentDocument(null)
      } finally {
        setIsImporting(false)
      }
    },
    [currentDocument, parsedData]
  )

  const handleMappingCancel = useCallback(() => {
    setShowMappingDialog(false)
  }, [])

  // PDF handlers
  const handlePDFConfirm = useCallback(() => {
    // PDF data is already saved during processing, just close the preview
    setIsSavingPDF(true)
    try {
      toast.success('PDF data saved successfully')
      setPdfResult(null)
      setCurrentDocument(null)
    } finally {
      setIsSavingPDF(false)
    }
  }, [])

  const handlePDFCancel = useCallback(async () => {
    // User cancelled - delete the uploaded document
    if (currentDocument) {
      await deleteDocument(currentDocument.id)
      setDocuments((prev) => prev.filter((d) => d.id !== currentDocument.id))
      toast.info('PDF upload cancelled')
    }
    setPdfResult(null)
    setCurrentDocument(null)
  }, [currentDocument])

  const handleDelete = useCallback(async (documentId: string) => {
    startTransition(async () => {
      const { error } = await deleteDocument(documentId)

      if (error) {
        toast.error(error)
        return
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      toast.success('Document deleted')
    })
  }, [])

  const handleView = useCallback((document: Document) => {
    setViewDocument(document)
    setShowViewModal(true)
  }, [])

  return (
    <div className="space-y-lg">
      {/* Upload Section */}
      <section>
        <h2 className="text-h3 text-foreground mb-md">Upload New Document</h2>
        <DocumentDropZone
          onFileSelect={handleFileSelect}
          accept=".csv,.pdf"
          maxSizeMB={10}
          disabled={isPending || isProcessingPDF || !!pdfResult || !!parsedData}
        />
      </section>

      {/* PDF Processing Indicator */}
      {isProcessingPDF && (
        <section>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-body font-medium text-foreground mb-1">
                Extracting financial data...
              </h3>
              <p className="text-small text-muted-foreground text-center max-w-md">
                Analyzing your document with AI. Complex documents with multiple tables
                and pages may take 2-3 minutes. You&apos;ll see a preview when complete.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* PDF Preview (after upload) */}
      {pdfResult && (
        <section>
          <PDFExtractionPreview
            result={pdfResult}
            onConfirm={handlePDFConfirm}
            onCancel={handlePDFCancel}
            isLoading={isSavingPDF}
          />
        </section>
      )}

      {/* CSV Preview (after upload) */}
      {parsedData && !showMappingDialog && (
        <section>
          <CSVPreview
            data={parsedData}
            onConfirm={handlePreviewConfirm}
            onCancel={handlePreviewCancel}
            onChangeType={handleTypeChange}
          />
        </section>
      )}

      {/* Column Mapping Dialog */}
      {parsedData && currentDocument && (
        <CSVMappingDialog
          open={showMappingDialog}
          onOpenChange={setShowMappingDialog}
          headers={parsedData.headers}
          csvType={parsedData.detectedType}
          onConfirm={handleMappingConfirm}
          onCancel={handleMappingCancel}
          isLoading={isImporting}
        />
      )}

      {/* View Data Modal */}
      <DocumentDataModal
        document={viewDocument}
        open={showViewModal}
        onOpenChange={setShowViewModal}
      />

      {/* Documents List */}
      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-h3 text-foreground">Uploaded Documents</h2>
          {documents.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant={fileTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFileTypeFilter('all')}
              >
                All ({documentCounts.all})
              </Button>
              <Button
                variant={fileTypeFilter === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFileTypeFilter('csv')}
              >
                CSV ({documentCounts.csv})
              </Button>
              <Button
                variant={fileTypeFilter === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFileTypeFilter('pdf')}
              >
                PDF ({documentCounts.pdf})
              </Button>
            </div>
          )}
        </div>
        <DocumentList
          documents={filteredDocuments}
          onDelete={handleDelete}
          onView={handleView}
          fileTypeFilter={fileTypeFilter}
        />
      </section>
    </div>
  )
}
