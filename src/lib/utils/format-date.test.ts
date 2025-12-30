import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { formatRelativeDate, getDateGroup } from './format-date'

describe('format-date', () => {
  // Mock the current date to ensure consistent test results
  const mockNow = new Date('2025-12-30T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatRelativeDate', () => {
    it('returns relative time for today', () => {
      const twoHoursAgo = new Date('2025-12-30T10:00:00Z').toISOString()
      const result = formatRelativeDate(twoHoursAgo)
      expect(result).toContain('hours ago')
    })

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date('2025-12-29T12:00:00Z').toISOString()
      const result = formatRelativeDate(yesterday)
      expect(result).toBe('Yesterday')
    })

    it('returns day name for this week', () => {
      // Sunday Dec 28, 2025 is in the same week as Dec 30
      const sunday = new Date('2025-12-28T12:00:00Z').toISOString()
      const result = formatRelativeDate(sunday)
      expect(result).toBe('Sunday')
    })

    it('returns formatted date for older dates', () => {
      const oldDate = new Date('2025-12-15T12:00:00Z').toISOString()
      const result = formatRelativeDate(oldDate)
      expect(result).toBe('Dec 15')
    })

    it('handles invalid date strings gracefully', () => {
      const result = formatRelativeDate('invalid-date')
      expect(result).toBe('Unknown')
    })

    it('handles empty string gracefully', () => {
      const result = formatRelativeDate('')
      expect(result).toBe('Unknown')
    })
  })

  describe('getDateGroup', () => {
    it('returns "Today" for today', () => {
      const today = new Date('2025-12-30T10:00:00Z').toISOString()
      const result = getDateGroup(today)
      expect(result).toBe('Today')
    })

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date('2025-12-29T12:00:00Z').toISOString()
      const result = getDateGroup(yesterday)
      expect(result).toBe('Yesterday')
    })

    it('returns "This Week" for earlier this week', () => {
      // Sunday Dec 28, 2025 is in the same week as Dec 30
      const sunday = new Date('2025-12-28T12:00:00Z').toISOString()
      const result = getDateGroup(sunday)
      expect(result).toBe('This Week')
    })

    it('returns "Older" for dates before this week', () => {
      const oldDate = new Date('2025-12-15T12:00:00Z').toISOString()
      const result = getDateGroup(oldDate)
      expect(result).toBe('Older')
    })

    it('handles invalid date strings gracefully', () => {
      const result = getDateGroup('invalid-date')
      expect(result).toBe('Older')
    })

    it('handles empty string gracefully', () => {
      const result = getDateGroup('')
      expect(result).toBe('Older')
    })
  })
})
