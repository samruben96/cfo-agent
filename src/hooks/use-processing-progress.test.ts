/**
 * Tests for useProcessingProgress hook.
 * Story: 3.5 Document Processing Status & Notifications
 */
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { useProcessingProgress } from './use-processing-progress'

describe('useProcessingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with empty progressMap', () => {
      const { result } = renderHook(() => useProcessingProgress())

      expect(result.current.progressMap.size).toBe(0)
    })
  })

  describe('startProcessing', () => {
    it('creates progress entry for document with uploading stage', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1', 1024)
      })

      const progress = result.current.getProgress('doc-1')
      expect(progress?.stage).toBe('uploading')
      expect(progress?.startTime).not.toBeNull()
      expect(progress?.uploadProgress).toBe(0)
      expect(progress?.fileSize).toBe(1024)
    })

    it('supports multiple documents', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1', 1024)
        result.current.startProcessing('doc-2', 2048)
      })

      expect(result.current.progressMap.size).toBe(2)
      expect(result.current.getProgress('doc-1')?.fileSize).toBe(1024)
      expect(result.current.getProgress('doc-2')?.fileSize).toBe(2048)
    })
  })

  describe('setUploadProgress', () => {
    it('updates upload progress for specific document', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.setUploadProgress('doc-1', 50)
      })

      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(50)
    })

    it('clamps progress to 0-100 range', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.setUploadProgress('doc-1', 150)
      })

      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(100)

      act(() => {
        result.current.setUploadProgress('doc-1', -20)
      })

      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(0)
    })

    it('does not affect other documents', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.startProcessing('doc-2')
        result.current.setUploadProgress('doc-1', 50)
      })

      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(50)
      expect(result.current.getProgress('doc-2')?.uploadProgress).toBe(0)
    })
  })

  describe('setStage', () => {
    it('transitions to processing stage', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.setStage('doc-1', 'processing')
      })

      expect(result.current.getProgress('doc-1')?.stage).toBe('processing')
    })

    it('transitions through all stages', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })
      expect(result.current.getProgress('doc-1')?.stage).toBe('uploading')

      act(() => {
        result.current.setStage('doc-1', 'processing')
      })
      expect(result.current.getProgress('doc-1')?.stage).toBe('processing')

      act(() => {
        result.current.setStage('doc-1', 'extracting')
      })
      expect(result.current.getProgress('doc-1')?.stage).toBe('extracting')

      act(() => {
        result.current.setStage('doc-1', 'complete')
      })
      expect(result.current.getProgress('doc-1')?.stage).toBe('complete')
    })

    it('sets uploadProgress to 100 when moving past uploading', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.setUploadProgress('doc-1', 50)
        result.current.setStage('doc-1', 'processing')
      })

      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(100)
    })
  })

  describe('complete', () => {
    it('sets stage to complete', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.complete('doc-1')
      })

      expect(result.current.getProgress('doc-1')?.stage).toBe('complete')
      expect(result.current.getProgress('doc-1')?.uploadProgress).toBe(100)
    })
  })

  describe('fail', () => {
    it('sets stage to error with message', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.fail('doc-1', 'Network error')
      })

      expect(result.current.getProgress('doc-1')?.stage).toBe('error')
      expect(result.current.getProgress('doc-1')?.error).toBe('Network error')
    })
  })

  describe('reset', () => {
    it('removes document from progressMap', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
        result.current.startProcessing('doc-2')
        result.current.reset('doc-1')
      })

      expect(result.current.progressMap.size).toBe(1)
      expect(result.current.getProgress('doc-1')).toBeUndefined()
      expect(result.current.getProgress('doc-2')).toBeDefined()
    })
  })

  describe('elapsed time tracking', () => {
    it('tracks elapsed seconds during processing', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)
    })

    it('stops tracking when processing completes', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)

      act(() => {
        result.current.complete('doc-1')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should stay at 5 seconds after completion
      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)
    })

    it('stops tracking when processing fails', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)

      act(() => {
        result.current.fail('doc-1', 'Error')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should stay at 5 seconds after failure
      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)
    })

    it('tracks multiple documents independently', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      act(() => {
        result.current.startProcessing('doc-2')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // doc-1: started 5s ago
      // doc-2: started 2s ago
      expect(result.current.getProgress('doc-1')?.elapsedSeconds).toBe(5)
      expect(result.current.getProgress('doc-2')?.elapsedSeconds).toBe(2)
    })
  })

  describe('timeout detection', () => {
    it('sets isTimedOut to true after 3 minutes', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1')
      })

      expect(result.current.getProgress('doc-1')?.isTimedOut).toBe(false)

      // Advance to just before timeout (179 seconds)
      act(() => {
        vi.advanceTimersByTime(179000)
      })

      expect(result.current.getProgress('doc-1')?.isTimedOut).toBe(false)

      // Advance past timeout (180 seconds total)
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.getProgress('doc-1')?.isTimedOut).toBe(true)
    })
  })

  describe('getProgress', () => {
    it('returns undefined for unknown document', () => {
      const { result } = renderHook(() => useProcessingProgress())

      expect(result.current.getProgress('unknown-doc')).toBeUndefined()
    })

    it('returns progress state for known document', () => {
      const { result } = renderHook(() => useProcessingProgress())

      act(() => {
        result.current.startProcessing('doc-1', 1024)
        result.current.setStage('doc-1', 'processing')
      })

      const progress = result.current.getProgress('doc-1')
      expect(progress).toBeDefined()
      expect(progress?.stage).toBe('processing')
      expect(progress?.fileSize).toBe(1024)
    })
  })
})
