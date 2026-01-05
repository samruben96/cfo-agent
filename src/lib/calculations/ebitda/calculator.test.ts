/**
 * Tests for EBITDA calculation engine.
 * Story: 5-2-ebitda-calculation
 */

import { describe, it, expect } from 'vitest'

import { calculateEBITDA, calculateEBITDAMargin } from './calculator'
import type { RevenueData, ExpenseData } from './types'

describe('calculateEBITDA', () => {
  const mockRevenueSource = {
    type: 'pl_document' as const,
    documentId: 'doc-123',
    filename: 'pl-2024.pdf',
    lastUpdated: '2024-12-01',
    confidence: 'high' as const,
  }

  const mockExpenseSource = {
    type: 'pl_document' as const,
    documentId: 'doc-123',
    filename: 'pl-2024.pdf',
    lastUpdated: '2024-12-01',
    amount: 80000,
  }

  it('calculates EBITDA correctly with all data present', () => {
    const revenue: RevenueData = {
      amount: 100000,
      source: mockRevenueSource,
    }

    const expenses: ExpenseData = {
      total: 80000,
      categories: [
        { name: 'Payroll', amount: 50000, source: mockExpenseSource },
        { name: 'Rent', amount: 20000, source: mockExpenseSource },
        { name: 'Other', amount: 10000, source: mockExpenseSource },
      ],
      sources: [mockExpenseSource],
    }

    const result = calculateEBITDA(revenue, expenses)

    expect(result.ebitda).toBe(20000) // 100000 - 80000
    expect(result.revenue).toBe(100000)
    expect(result.totalOperatingExpenses).toBe(80000)
    expect(result.ebitdaMargin).toBe(20) // (20000 / 100000) * 100
    expect(result.revenueSource).toEqual(mockRevenueSource)
    expect(result.expenseCategories).toHaveLength(3)
  })

  it('handles zero revenue (margin = 0)', () => {
    const revenue: RevenueData = {
      amount: 0,
      source: mockRevenueSource,
    }

    const expenses: ExpenseData = {
      total: 50000,
      categories: [],
      sources: [mockExpenseSource],
    }

    const result = calculateEBITDA(revenue, expenses)

    expect(result.ebitda).toBe(-50000) // 0 - 50000
    expect(result.revenue).toBe(0)
    expect(result.ebitdaMargin).toBe(0) // Avoid division by zero
  })

  it('handles negative EBITDA (operating loss)', () => {
    const revenue: RevenueData = {
      amount: 50000,
      source: mockRevenueSource,
    }

    const expenses: ExpenseData = {
      total: 80000,
      categories: [],
      sources: [mockExpenseSource],
    }

    const result = calculateEBITDA(revenue, expenses)

    expect(result.ebitda).toBe(-30000) // 50000 - 80000 = -30000
    expect(result.ebitdaMargin).toBe(-60) // (-30000 / 50000) * 100
  })

  it('handles zero expenses', () => {
    const revenue: RevenueData = {
      amount: 100000,
      source: mockRevenueSource,
    }

    const expenses: ExpenseData = {
      total: 0,
      categories: [],
      sources: [],
    }

    const result = calculateEBITDA(revenue, expenses)

    expect(result.ebitda).toBe(100000) // All revenue is profit
    expect(result.ebitdaMargin).toBe(100) // 100% margin
  })

  it('uses Math.round to avoid floating point issues', () => {
    const revenue: RevenueData = {
      amount: 333333,
      source: mockRevenueSource,
    }

    const expenses: ExpenseData = {
      total: 222222,
      categories: [],
      sources: [],
    }

    const result = calculateEBITDA(revenue, expenses)

    // EBITDA should be a clean integer
    expect(result.ebitda).toBe(111111)
    // Margin should be rounded to 2 decimal places
    expect(Number.isFinite(result.ebitdaMargin)).toBe(true)
  })

  it('preserves period information when provided', () => {
    const revenue: RevenueData = {
      amount: 100000,
      source: {
        ...mockRevenueSource,
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
      },
    }

    const expenses: ExpenseData = {
      total: 80000,
      categories: [],
      sources: [],
    }

    const result = calculateEBITDA(revenue, expenses)

    expect(result.period).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
  })
})

describe('calculateEBITDAMargin', () => {
  it('calculates margin as percentage', () => {
    expect(calculateEBITDAMargin(25000, 100000)).toBe(25)
  })

  it('handles zero revenue (returns 0)', () => {
    expect(calculateEBITDAMargin(25000, 0)).toBe(0)
  })

  it('handles negative EBITDA', () => {
    expect(calculateEBITDAMargin(-25000, 100000)).toBe(-25)
  })

  it('rounds to 2 decimal places', () => {
    // 33333 / 100000 = 0.33333 = 33.33%
    expect(calculateEBITDAMargin(33333, 100000)).toBe(33.33)
  })

  it('handles 100% margin', () => {
    expect(calculateEBITDAMargin(100000, 100000)).toBe(100)
  })
})
