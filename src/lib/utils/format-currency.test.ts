/**
 * Tests for currency formatting utilities.
 */

import { describe, it, expect } from 'vitest'

import { formatCurrency, CURRENCY_FORMAT_OPTIONS } from './format-currency'

describe('format-currency', () => {
  describe('formatCurrency', () => {
    it('formats whole numbers with comma separators', () => {
      expect(formatCurrency(65000)).toBe('$65,000')
    })

    it('formats large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000')
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0')
    })

    it('rounds decimal values to whole numbers', () => {
      expect(formatCurrency(65000.99)).toBe('$65,001')
      expect(formatCurrency(65000.49)).toBe('$65,000')
    })

    it('handles negative numbers', () => {
      // Note: toLocaleString puts negative sign after $ prefix
      expect(formatCurrency(-5000)).toBe('$-5,000')
    })

    it('handles small numbers', () => {
      expect(formatCurrency(50)).toBe('$50')
    })
  })

  describe('CURRENCY_FORMAT_OPTIONS', () => {
    it('has maximumFractionDigits set to 0', () => {
      expect(CURRENCY_FORMAT_OPTIONS.maximumFractionDigits).toBe(0)
    })
  })
})
