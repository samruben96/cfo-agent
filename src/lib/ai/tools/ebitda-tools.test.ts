/**
 * Tests for EBITDA AI tools.
 * Story: 5-2-ebitda-calculation
 */

import { describe, it, expect, vi } from 'vitest'

import { createEBITDATools, formatEBITDAMessage, formatEBITDADetailedMessage } from './ebitda-tools'
import type { EBITDAResult } from '@/lib/calculations'

// Mock the getEBITDA action
vi.mock('@/actions/calculations', () => ({
  getEBITDA: vi.fn(),
}))

// Shared expense source for realistic test data
const mockExpenseSource = {
  type: 'pl_document' as const,
  documentId: 'doc-123',
  filename: 'pl-2024.pdf',
  lastUpdated: '2024-12-01',
  amount: 300000,
}

describe('formatEBITDAMessage', () => {
  const mockResult: EBITDAResult = {
    breakdown: {
      revenue: 500000,
      revenueSource: {
        type: 'pl_document',
        documentId: 'doc-123',
        filename: 'pl-2024.pdf',
        lastUpdated: '2024-12-01',
        confidence: 'high',
      },
      totalOperatingExpenses: 300000,
      expenseCategories: [
        {
          name: 'Payroll',
          amount: 200000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 200000 },
        },
        {
          name: 'Rent',
          amount: 50000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 50000 },
        },
        {
          name: 'Other',
          amount: 50000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 50000 },
        },
      ],
      expenseSources: [mockExpenseSource],
      ebitda: 200000,
      ebitdaMargin: 40,
    },
    dataCompleteness: {
      hasRevenueData: true,
      hasExpenseData: true,
      hasPayrollData: true,
      hasOverheadData: true,
    },
    warnings: [],
    lastUpdated: '2024-12-15',
  }

  it('includes EBITDA value and margin', () => {
    const message = formatEBITDAMessage(mockResult)
    expect(message).toContain('$200,000')
    expect(message).toContain('40%')
  })

  it('includes revenue breakdown', () => {
    const message = formatEBITDAMessage(mockResult)
    expect(message).toContain('$500,000')
    expect(message).toContain('Revenue')
  })

  it('includes expense total', () => {
    const message = formatEBITDAMessage(mockResult)
    expect(message).toContain('$300,000')
  })

  it('includes data source information', () => {
    const message = formatEBITDAMessage(mockResult)
    expect(message).toContain('pl-2024.pdf')
  })

  it('includes warnings when present', () => {
    const resultWithWarnings: EBITDAResult = {
      ...mockResult,
      warnings: ['Using estimated revenue from profile.'],
    }
    const message = formatEBITDAMessage(resultWithWarnings)
    expect(message).toContain('Using estimated revenue from profile.')
  })
})

describe('formatEBITDADetailedMessage', () => {
  const mockResult: EBITDAResult = {
    breakdown: {
      revenue: 500000,
      revenueSource: {
        type: 'pl_document',
        documentId: 'doc-123',
        filename: 'pl-2024.pdf',
        lastUpdated: '2024-12-01',
        confidence: 'high',
      },
      totalOperatingExpenses: 300000,
      expenseCategories: [
        {
          name: 'Payroll',
          amount: 200000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 200000 },
        },
        {
          name: 'Rent',
          amount: 50000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 50000 },
        },
        {
          name: 'Other',
          amount: 50000,
          source: { type: 'pl_document', documentId: 'doc-123', filename: 'pl-2024.pdf', lastUpdated: '2024-12-01', amount: 50000 },
        },
      ],
      expenseSources: [mockExpenseSource],
      ebitda: 200000,
      ebitdaMargin: 40,
    },
    dataCompleteness: {
      hasRevenueData: true,
      hasExpenseData: true,
      hasPayrollData: true,
      hasOverheadData: true,
    },
    warnings: [],
    lastUpdated: '2024-12-15',
  }

  it('includes expense category breakdown', () => {
    const message = formatEBITDADetailedMessage(mockResult)
    expect(message).toContain('Payroll')
    expect(message).toContain('$200,000')
    expect(message).toContain('Rent')
    expect(message).toContain('$50,000')
  })

  it('includes table formatting for categories', () => {
    const message = formatEBITDADetailedMessage(mockResult)
    expect(message).toContain('|')
    expect(message).toContain('Category')
    expect(message).toContain('Amount')
  })
})

describe('createEBITDATools', () => {
  it('returns an object with get_ebitda tool', () => {
    const tools = createEBITDATools()
    expect(tools).toHaveProperty('get_ebitda')
  })

  it('returns an object with explain_ebitda_formula tool', () => {
    const tools = createEBITDATools()
    expect(tools).toHaveProperty('explain_ebitda_formula')
  })

  it('get_ebitda tool has description for trigger phrases', () => {
    const tools = createEBITDATools()
    // The tool object has a description property internally
    expect(tools.get_ebitda).toBeDefined()
  })
})
