'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

import type { ProcessingStage } from '@/components/documents/ProcessingProgress'

/**
 * State for tracking a single document's processing progress.
 */
export interface DocumentProgressState {
  /** Current processing stage */
  stage: ProcessingStage | 'idle'
  /** Upload progress percentage (0-100) */
  uploadProgress: number
  /** Timestamp when processing started (null if idle) */
  startTime: number | null
  /** Elapsed seconds since processing started */
  elapsedSeconds: number
  /** Error message if stage is 'error' */
  error: string | null
  /** Whether processing is considered timed out (> 3 minutes) */
  isTimedOut: boolean
  /** File size in bytes (for ETA calculation) */
  fileSize: number
}

/**
 * State for tracking document processing progress.
 * @deprecated Use DocumentProgressState instead
 */
export type ProcessingProgressState = DocumentProgressState

/**
 * Actions returned by useProcessingProgress hook.
 */
export interface ProcessingProgressActions {
  /** Start a new processing session for a document */
  startProcessing: (documentId: string, fileSize?: number) => void
  /** Update upload progress (0-100) for a document */
  setUploadProgress: (documentId: string, progress: number) => void
  /** Transition to next stage for a document */
  setStage: (documentId: string, stage: ProcessingStage) => void
  /** Mark processing as complete for a document */
  complete: (documentId: string) => void
  /** Mark processing as failed with error message for a document */
  fail: (documentId: string, errorMessage: string) => void
  /** Reset a specific document's state */
  reset: (documentId: string) => void
  /** Get progress state for a specific document */
  getProgress: (documentId: string) => DocumentProgressState | undefined
}

/**
 * Return type for useProcessingProgress hook.
 */
export type UseProcessingProgressResult = ProcessingProgressActions & {
  /** Map of document IDs to their progress states */
  progressMap: Map<string, DocumentProgressState>
}

/**
 * Timeout threshold in seconds (3 minutes).
 */
const TIMEOUT_THRESHOLD_SECONDS = 180

/**
 * Default state for a new document.
 */
const createDefaultState = (fileSize: number = 0): DocumentProgressState => ({
  stage: 'uploading',
  uploadProgress: 0,
  startTime: Date.now(),
  elapsedSeconds: 0,
  error: null,
  isTimedOut: false,
  fileSize,
})

/**
 * Hook for tracking multi-step document processing progress.
 * Supports tracking multiple documents simultaneously.
 *
 * @example
 * ```tsx
 * const progress = useProcessingProgress()
 *
 * const handleUpload = async (file: File) => {
 *   const docId = 'doc-123'
 *   progress.startProcessing(docId, file.size)
 *   progress.setUploadProgress(docId, 50)
 *   progress.setUploadProgress(docId, 100)
 *   progress.setStage(docId, 'processing')
 *   // ... wait for processing
 *   progress.setStage(docId, 'extracting')
 *   // ... wait for extraction
 *   progress.complete(docId)
 * }
 * ```
 */
export function useProcessingProgress(): UseProcessingProgressResult {
  const [progressMap, setProgressMap] = useState<Map<string, DocumentProgressState>>(new Map())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update elapsed time for all active documents
  useEffect(() => {
    const hasActiveDocuments = Array.from(progressMap.values()).some(
      (state) => state.startTime !== null && state.stage !== 'complete' && state.stage !== 'error' && state.stage !== 'idle'
    )

    if (hasActiveDocuments) {
      timerRef.current = setInterval(() => {
        setProgressMap((prev) => {
          const newMap = new Map(prev)
          let changed = false

          newMap.forEach((state, docId) => {
            if (state.startTime !== null && state.stage !== 'complete' && state.stage !== 'error' && state.stage !== 'idle') {
              const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
              if (elapsed !== state.elapsedSeconds) {
                newMap.set(docId, {
                  ...state,
                  elapsedSeconds: elapsed,
                  isTimedOut: elapsed >= TIMEOUT_THRESHOLD_SECONDS,
                })
                changed = true
              }
            }
          })

          return changed ? newMap : prev
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [progressMap])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startProcessing = useCallback((documentId: string, fileSize: number = 0) => {
    setProgressMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(documentId, createDefaultState(fileSize))
      return newMap
    })
  }, [])

  const setUploadProgress = useCallback((documentId: string, progress: number) => {
    setProgressMap((prev) => {
      const state = prev.get(documentId)
      if (!state) return prev
      const newMap = new Map(prev)
      newMap.set(documentId, {
        ...state,
        uploadProgress: Math.min(100, Math.max(0, progress)),
      })
      return newMap
    })
  }, [])

  const setStage = useCallback((documentId: string, stage: ProcessingStage) => {
    setProgressMap((prev) => {
      const state = prev.get(documentId)
      if (!state) return prev
      const newMap = new Map(prev)
      newMap.set(documentId, {
        ...state,
        stage,
        uploadProgress: stage === 'uploading' ? state.uploadProgress : 100,
      })
      return newMap
    })
  }, [])

  const complete = useCallback((documentId: string) => {
    setProgressMap((prev) => {
      const state = prev.get(documentId)
      if (!state) return prev
      const newMap = new Map(prev)
      newMap.set(documentId, {
        ...state,
        stage: 'complete',
        uploadProgress: 100,
      })
      return newMap
    })
  }, [])

  const fail = useCallback((documentId: string, errorMessage: string) => {
    setProgressMap((prev) => {
      const state = prev.get(documentId)
      if (!state) return prev
      const newMap = new Map(prev)
      newMap.set(documentId, {
        ...state,
        stage: 'error',
        error: errorMessage,
      })
      return newMap
    })
  }, [])

  const reset = useCallback((documentId: string) => {
    setProgressMap((prev) => {
      const newMap = new Map(prev)
      newMap.delete(documentId)
      return newMap
    })
  }, [])

  const getProgress = useCallback((documentId: string): DocumentProgressState | undefined => {
    return progressMap.get(documentId)
  }, [progressMap])

  return {
    progressMap,
    startProcessing,
    setUploadProgress,
    setStage,
    complete,
    fail,
    reset,
    getProgress,
  }
}
