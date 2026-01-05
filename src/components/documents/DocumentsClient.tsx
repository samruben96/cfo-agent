'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// Loader2 removed - now using ProcessingProgress component instead
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentDropZone } from './DocumentDropZone'
import { DocumentList } from './DocumentList'
import { CSVPreview } from './CSVPreview'
import { CSVMappingDialog } from './CSVMappingDialog'
import { PDFExtractionPreview } from './PDFExtractionPreview'
import { DocumentDataModal } from './DocumentDataModal'
import { ProcessingProgress } from './ProcessingProgress'
import { uploadDocument, processCSV, processPDF, deleteDocument, confirmCSVImport, getDocumentDownloadUrl } from '@/actions/documents'
import { useDocumentStatus } from '@/hooks/use-document-status'
import { useProcessingProgress } from '@/hooks/use-processing-progress'
import { getToastError } from '@/lib/errors/friendly-errors'
import { getCSVTypeLabel } from '@/lib/documents/csv-type-detector'
import { autoMapColumns } from '@/lib/documents/csv-auto-mapper'

import type { Document, ParsedCSVData, CSVType } from '@/types/documents'
import type { PDFProcessingResult } from '@/lib/documents/pdf-processor'
import type { DocumentStatusChange } from '@/hooks/use-document-status'

export type FileTypeFilter = 'all' | 'csv' | 'pdf'

interface DocumentsClientProps {
  initialDocuments: Document[]
}

export function DocumentsClient({ initialDocuments }: DocumentsClientProps) {
  const router = useRouter()
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

  // View data modal state
  const [viewDocument, setViewDocument] = useState<Document | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // Processing progress tracking
  const progress = useProcessingProgress()

  /**
   * Navigate to chat with error context - AC #17, #18
   * Opens chat with AI ready to help resolve document processing error
   */
  const handleChatToResolve = useCallback((document: Document) => {
    // Navigate to chat with document ID and error flag
    router.push(`/chat?documentId=${document.id}&error=true`)
  }, [router])

  // Handle document retry - defined first so it can be used in handleStatusChange
  const handleRetry = useCallback(async (document: Document) => {
    progress.startProcessing(document.id, document.fileSize)
    progress.setStage(document.id, 'processing')

    try {
      if (document.fileType === 'pdf') {
        const { data: result, error } = await processPDF(document.id)
        if (error || !result) {
          progress.fail(document.id, error || 'Failed to process PDF')
          const friendlyError = getToastError(error || 'Processing failed', 'document_processing')
          toast.error(friendlyError.title, { description: friendlyError.description })
          return
        }
        setPdfResult(result)
        setCurrentDocument(document)
        progress.complete(document.id)
      } else {
        const { data: parsed, error } = await processCSV(document.id)
        if (error || !parsed) {
          progress.fail(document.id, error || 'Failed to process CSV')
          const friendlyError = getToastError(error || 'Processing failed', 'csv_import')
          toast.error(friendlyError.title, { description: friendlyError.description })
          return
        }
        setParsedData(parsed)
        setCurrentDocument(document)
        progress.complete(document.id)
      }
    } catch {
      progress.fail(document.id, 'Retry failed')
    }
  }, [progress])

  // Handle realtime status changes from Supabase
  const handleStatusChange = useCallback((change: DocumentStatusChange) => {
    console.log('[DocumentsClient]', {
      action: 'realtimeStatusChange',
      documentId: change.documentId,
      newStatus: change.newStatus,
    })

    // Update document in local state
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === change.documentId ? change.document : d
      )
    )

    // Show notifications based on status change
    if (change.newStatus === 'completed') {
      toast.success(`Document "${change.document.filename}" processed successfully`, {
        action: {
          label: 'View',
          onClick: () => {
            setViewDocument(change.document)
            setShowViewModal(true)
          },
        },
      })
      progress.complete(change.documentId)
    } else if (change.newStatus === 'error') {
      const friendlyError = getToastError(
        change.document.errorMessage || `Failed to process "${change.document.filename}"`,
        'document_processing'
      )
      toast.error(friendlyError.title, {
        description: friendlyError.description,
        action: {
          label: 'Retry',
          onClick: () => handleRetry(change.document),
        },
      })
      progress.fail(change.documentId, change.document.errorMessage || 'Processing failed')
    } else if (change.newStatus === 'processing') {
      progress.setStage(change.documentId, 'processing')
    }
  }, [progress, handleRetry])

  // Subscribe to realtime document status changes
  useDocumentStatus({
    onStatusChange: handleStatusChange,
    onError: (error) => {
      console.error('[DocumentsClient]', { action: 'realtimeError', error })
      // Don't show toast for realtime errors - fallback to manual refresh
    },
  })

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

  // Process document after upload (runs asynchronously)
  const processDocument = useCallback(async (document: Document, isPDF: boolean) => {
    progress.setStage(document.id, 'processing')

    if (isPDF) {
      const { data: result, error: processError } = await processPDF(document.id)

      if (processError || !result) {
        progress.fail(document.id, processError || 'Failed to process PDF')
        const friendlyError = getToastError(processError || 'Failed to process PDF', 'document_processing')
        toast.error(friendlyError.title, { description: friendlyError.description })
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === document.id
              ? { ...d, processingStatus: 'error' as const, errorMessage: processError || undefined }
              : d
          )
        )
        return
      }

      progress.setStage(document.id, 'extracting')
      // Update document with extracted data (no preview needed - smart summary shows in card)
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === document.id
            ? { ...d, processingStatus: 'completed', extractedData: result.extractedData }
            : d
        )
      )

      progress.complete(document.id)
      const schemaLabel = result.schemaUsed === 'pl' ? 'P&L'
        : result.schemaUsed === 'payroll' ? 'Payroll'
        : result.schemaUsed === 'expense' ? 'Expense Report'
        : 'Document'

      // Skip preview for happy path - show success toast
      toast.success(`${schemaLabel} extracted successfully`)

      // Clear current document (no preview modal needed)
      setCurrentDocument(null)
    } else {
      const { data: parsed, error: processError } = await processCSV(document.id)

      if (processError || !parsed) {
        progress.fail(document.id, processError || 'Failed to process CSV')
        const friendlyError = getToastError(processError || 'Failed to process CSV', 'csv_import')
        toast.error(friendlyError.title, { description: friendlyError.description })
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === document.id
              ? { ...d, processingStatus: 'error' as const, errorMessage: processError || undefined }
              : d
          )
        )
        return
      }

      progress.setStage(document.id, 'extracting')

      // Update document with CSV info
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === document.id
            ? { ...d, processingStatus: 'completed', csvType: parsed.detectedType, rowCount: parsed.totalRows }
            : d
        )
      )

      progress.complete(document.id)

      // For high-confidence detections (>80%), auto-import without dialog - happy path!
      // For unknown type or low confidence, show preview for user to select type
      if (parsed.detectedType !== 'unknown' && parsed.confidence >= 0.8) {
        // Auto-generate mappings using the auto-mapper
        const autoMappingResult = autoMapColumns(parsed.headers, parsed.detectedType)

        // Only auto-import if mapping is also confident
        if (!autoMappingResult.shouldAutoApply) {
          // Mapping not confident enough - show preview for user to fix
          setParsedData(parsed)
          setCurrentDocument(document)
          toast.info('Please review column mappings')
          return
        }

        const { error: importError } = await confirmCSVImport(document.id, autoMappingResult.mappings, parsed.detectedType)

        if (importError) {
          // If auto-import fails, fall back to manual flow
          setParsedData(parsed)
          setCurrentDocument(document)
          const friendlyError = getToastError(importError, 'csv_import')
          toast.error(friendlyError.title, { description: friendlyError.description })
        } else {
          // Success - show toast (no preview/dialog needed)
          toast.success(`${getCSVTypeLabel(parsed.detectedType)} imported successfully`)
          // Clear state - no preview needed
          setCurrentDocument(null)
        }
      } else {
        // Low confidence or unknown type - show preview for user to select/confirm
        setParsedData(parsed)
        setCurrentDocument(document)
        toast.info('Please review and confirm the CSV type')
      }
    }
  }, [progress])

  const handleFileSelect = useCallback(async (file: File) => {
    // Generate temporary ID for upload tracking (will switch to real ID after upload)
    const tempId = `upload-${Date.now()}`

    // Start progress tracking with file size
    progress.startProcessing(tempId, file.size)

    // Create FormData for upload
    const formData = new FormData()
    formData.append('file', file)

    // Simulate upload progress
    progress.setUploadProgress(tempId, 30)

    // Upload file
    const { data: document, error: uploadError } = await uploadDocument(formData)

    progress.setUploadProgress(tempId, 100)

    if (uploadError || !document) {
      progress.fail(tempId, uploadError || 'Failed to upload file')
      const friendlyError = getToastError(uploadError || 'Failed to upload file', 'document_upload')
      toast.error(friendlyError.title, { description: friendlyError.description })
      throw new Error(uploadError || 'Upload failed')
    }

    // Clean up temp progress and start tracking with real document ID
    progress.reset(tempId)
    progress.startProcessing(document.id, file.size)

    // Add to documents list with processing status
    setDocuments((prev) => [document, ...prev])
    setCurrentDocument(document)

    // Determine file type
    const isPDF = file.name.toLowerCase().endsWith('.pdf')

    // Fire off processing asynchronously (don't await - allows dropzone to reset)
    processDocument(document, isPDF)

    // Return immediately so dropzone can accept another file
  }, [progress, processDocument])

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
          const friendlyError = getToastError(error, 'csv_import')
          toast.error(friendlyError.title, { description: friendlyError.description })
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
        const friendlyError = getToastError(error, 'api_request')
        toast.error(friendlyError.title, { description: friendlyError.description })
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

  const handleDownload = useCallback(async (document: Document) => {
    const { data: url, error } = await getDocumentDownloadUrl(document.id)
    if (error || !url) {
      const friendlyError = getToastError(error || 'Failed to download', 'api_request')
      toast.error(friendlyError.title, { description: friendlyError.description })
      return
    }
    // Fetch blob and trigger download (required for cross-origin URLs)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = blobUrl
      link.download = document.filename
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      const friendlyError = getToastError(err, 'api_request')
      toast.error(friendlyError.title, { description: friendlyError.description })
    }
  }, [])

  // Check if there's an active processing state
  const activeProcessing = (() => {
    // Find any document being processed (not complete, not error)
    for (const [id, state] of progress.progressMap.entries()) {
      if (state.stage === 'uploading' || state.stage === 'processing' || state.stage === 'extracting') {
        return { id, state }
      }
    }
    return null
  })()

  // Determine what to show in the upload section
  const showDropzone = !activeProcessing && !pdfResult && !parsedData
  const showProcessing = activeProcessing && !pdfResult && !parsedData

  return (
    <div className="space-y-lg">
      {/* Upload Section - shows dropzone, processing, or result */}
      <section>
        <h2 className="text-h3 text-foreground mb-md">
          {pdfResult || parsedData ? 'Review Extracted Data' : 'Upload New Document'}
        </h2>

        {/* Show dropzone when idle */}
        {showDropzone && (
          <DocumentDropZone
            onFileSelect={handleFileSelect}
            accept=".csv,.pdf"
            maxSizeMB={10}
            disabled={isPending}
          />
        )}

        {/* Show processing indicator when uploading/processing */}
        {showProcessing && (
          <Card>
            <CardContent className="py-8">
              <ProcessingProgress
                stage={activeProcessing.state.stage}
                uploadProgress={activeProcessing.state.uploadProgress}
                elapsedSeconds={activeProcessing.state.elapsedSeconds}
                errorMessage={activeProcessing.state.error || undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* PDF Preview (after processing complete) */}
        {pdfResult && (
          <PDFExtractionPreview
            result={pdfResult}
            onConfirm={handlePDFConfirm}
            onCancel={handlePDFCancel}
            isLoading={isSavingPDF}
          />
        )}

        {/* CSV Preview (after processing complete) */}
        {parsedData && !showMappingDialog && (
          <CSVPreview
            data={parsedData}
            onConfirm={handlePreviewConfirm}
            onCancel={handlePreviewCancel}
            onChangeType={handleTypeChange}
          />
        )}
      </section>

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
          onDownload={handleDownload}
          onRetry={handleRetry}
          onChatToResolve={handleChatToResolve}
          progressMap={progress.progressMap}
          fileTypeFilter={fileTypeFilter}
        />
      </section>
    </div>
  )
}
