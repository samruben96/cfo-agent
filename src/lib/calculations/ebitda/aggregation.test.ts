/**
 * Tests for EBITDA data aggregation functions.
 * Story: 5-2-ebitda-calculation
 */

import { describe, it, expect } from 'vitest'

import {
  aggregateRevenueFromSources,
  aggregateExpensesFromSources,
  getRevenueFromProfile,
} from './aggregation'
import type { PLExtraction } from '@/lib/documents/extraction-schemas'
import type { OverheadCosts } from '@/types/overhead-costs'
import type { EmployeeCostSummary } from '../types'

describe('getRevenueFromProfile', () => {
  it('maps under-250k to midpoint 125000', () => {
    expect(getRevenueFromProfile('under-250k')).toBe(125000)
  })

  it('maps 250k-500k to midpoint 375000', () => {
    expect(getRevenueFromProfile('250k-500k')).toBe(375000)
  })

  it('maps 500k-1m to midpoint 750000', () => {
    expect(getRevenueFromProfile('500k-1m')).toBe(750000)
  })

  it('maps 1m-2m to midpoint 1500000', () => {
    expect(getRevenueFromProfile('1m-2m')).toBe(1500000)
  })

  it('maps 2m-5m to midpoint 3500000', () => {
    expect(getRevenueFromProfile('2m-5m')).toBe(3500000)
  })

  it('maps 5m-plus to estimate 7500000', () => {
    expect(getRevenueFromProfile('5m-plus')).toBe(7500000)
  })

  it('returns null for unknown range', () => {
    expect(getRevenueFromProfile('unknown-range')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getRevenueFromProfile(null)).toBeNull()
  })
})

describe('aggregateRevenueFromSources', () => {
  const mockPLDocument: PLExtraction = {
    documentType: 'pl',
    period: { startDate: '2024-01-01', endDate: '2024-12-31' },
    revenue: { total: 500000, lineItems: [] },
    expenses: { total: 300000, categories: [] },
    netIncome: 200000,
    metadata: { companyName: 'Test', preparedBy: '', pageCount: 1 },
  }

  it('uses P&L document revenue when available', () => {
    const result = aggregateRevenueFromSources({
      plDocuments: [
        {
          documentId: 'doc-123',
          filename: 'pl-2024.pdf',
          lastUpdated: '2024-12-01',
          extraction: mockPLDocument,
        },
      ],
      profileRevenueRange: '250k-500k',
    })

    expect(result).not.toBeNull()
    expect(result!.amount).toBe(500000)
    expect(result!.source.type).toBe('pl_document')
    expect(result!.source.confidence).toBe('high')
    expect(result!.source.documentId).toBe('doc-123')
  })

  it('falls back to profile estimate when no P&L', () => {
    const result = aggregateRevenueFromSources({
      plDocuments: [],
      profileRevenueRange: '1m-2m',
    })

    expect(result).not.toBeNull()
    expect(result!.amount).toBe(1500000)
    expect(result!.source.type).toBe('profile_estimate')
    expect(result!.source.confidence).toBe('low')
  })

  it('uses most recent P&L when multiple exist', () => {
    const olderPL: PLExtraction = {
      ...mockPLDocument,
      revenue: { total: 400000, lineItems: [] },
    }

    const result = aggregateRevenueFromSources({
      plDocuments: [
        {
          documentId: 'doc-old',
          filename: 'pl-2023.pdf',
          lastUpdated: '2023-12-01',
          extraction: olderPL,
        },
        {
          documentId: 'doc-new',
          filename: 'pl-2024.pdf',
          lastUpdated: '2024-12-01',
          extraction: mockPLDocument,
        },
      ],
      profileRevenueRange: '250k-500k',
    })

    expect(result!.amount).toBe(500000) // Uses newer document
    expect(result!.source.documentId).toBe('doc-new')
  })

  it('returns null when no data available', () => {
    const result = aggregateRevenueFromSources({
      plDocuments: [],
      profileRevenueRange: null,
    })

    expect(result).toBeNull()
  })
})

describe('aggregateExpensesFromSources', () => {
  const mockPLDocument: PLExtraction = {
    documentType: 'pl',
    period: { startDate: '2024-01-01', endDate: '2024-12-31' },
    revenue: { total: 500000, lineItems: [] },
    expenses: {
      total: 300000,
      categories: [
        { category: 'Payroll', amount: 200000, lineItems: [] },
        { category: 'Rent', amount: 50000, lineItems: [] },
        { category: 'Marketing', amount: 50000, lineItems: [] },
      ],
    },
    netIncome: 200000,
    metadata: { companyName: 'Test', preparedBy: '', pageCount: 1 },
  }

  const mockOverhead: OverheadCosts = {
    id: 'oh-123',
    userId: 'user-123',
    monthlyRent: 5000,
    monthlyUtilities: 500,
    monthlyInsurance: 300,
    otherMonthlyCosts: 200,
    softwareCosts: [
      { id: 'sw-1', name: 'Slack', monthlyCost: 100 },
      { id: 'sw-2', name: 'QuickBooks', monthlyCost: 50 },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  }

  const mockEmployeeCostSummary: EmployeeCostSummary = {
    totalHeadcount: 5,
    totalFullyLoadedCost: 450000,
    averageFullyLoadedCost: 90000,
    totalBaseSalary: 400000,
    totalPayrollTaxes: 30600,
    totalBenefits: 15000,
    totalOverheadAllocated: 4400,
    hasOverheadData: true,
    hasBenefitsData: true,
    missingDataWarnings: [],
  }

  it('uses P&L expenses when available', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [
        {
          documentId: 'doc-123',
          filename: 'pl-2024.pdf',
          lastUpdated: '2024-12-01',
          extraction: mockPLDocument,
        },
      ],
      overheadCosts: mockOverhead,
      employeeCostSummary: mockEmployeeCostSummary,
    })

    expect(result.total).toBe(300000)
    expect(result.categories).toHaveLength(3)
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].type).toBe('pl_document')
  })

  it('combines overhead and payroll when no P&L', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [],
      overheadCosts: mockOverhead,
      employeeCostSummary: mockEmployeeCostSummary,
    })

    // Overhead: (5000 + 500 + 300 + 200 + 150) * 12 = 73800
    // Payroll: 450000 (fully loaded cost)
    const expectedOverhead = (5000 + 500 + 300 + 200 + 100 + 50) * 12
    const expectedTotal = expectedOverhead + 450000

    expect(result.total).toBe(expectedTotal)
    expect(result.categories).toHaveLength(2) // Overhead + Payroll
    expect(result.sources).toHaveLength(2)
  })

  it('handles overhead only (no payroll)', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [],
      overheadCosts: mockOverhead,
      employeeCostSummary: null,
    })

    // Monthly: 5000 + 500 + 300 + 200 + 100 + 50 = 6150
    // Annual: 6150 * 12 = 73800
    expect(result.total).toBe(73800)
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0].name).toBe('Overhead Costs')
  })

  it('handles payroll only (no overhead)', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [],
      overheadCosts: null,
      employeeCostSummary: mockEmployeeCostSummary,
    })

    expect(result.total).toBe(450000)
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0].name).toBe('Payroll & Employee Costs')
  })

  it('tracks sources for each expense category', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [
        {
          documentId: 'doc-123',
          filename: 'pl-2024.pdf',
          lastUpdated: '2024-12-01',
          extraction: mockPLDocument,
        },
      ],
      overheadCosts: null,
      employeeCostSummary: null,
    })

    for (const category of result.categories) {
      expect(category.source).toBeDefined()
      expect(category.source.type).toBe('pl_document')
    }
  })

  it('returns empty data when no sources available', () => {
    const result = aggregateExpensesFromSources({
      plDocuments: [],
      overheadCosts: null,
      employeeCostSummary: null,
    })

    expect(result.total).toBe(0)
    expect(result.categories).toHaveLength(0)
    expect(result.sources).toHaveLength(0)
  })
})
