/**
 * Data aggregation functions for EBITDA calculation.
 * Story: 5-2-ebitda-calculation
 *
 * Aggregates revenue and expense data from multiple sources:
 * - P&L documents (highest priority)
 * - Overhead costs (manual entry)
 * - Employee cost summary (from Story 5.1)
 * - Profile estimates (fallback)
 */

import type { PLExtraction } from '@/lib/documents/extraction-schemas'
import type { OverheadCosts } from '@/types/overhead-costs'
import type { EmployeeCostSummary } from '../types'
import type {
  RevenueData,
  ExpenseData,
  RevenueSource,
  ExpenseSource,
  ExpenseCategory,
} from './types'
import { REVENUE_RANGE_MIDPOINTS } from './types'
import { calculateTotalMonthlyOverhead } from '../employee-cost'

/**
 * Safely parses a date string to timestamp.
 * Returns 0 for invalid dates (treats them as oldest).
 */
function safeGetTime(dateString: string): number {
  const timestamp = new Date(dateString).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

/**
 * P&L document with metadata for aggregation.
 */
export interface PLDocumentWithMetadata {
  documentId: string
  filename: string
  lastUpdated: string
  extraction: PLExtraction
}

/**
 * Input for revenue aggregation.
 */
export interface RevenueAggregationInput {
  plDocuments: PLDocumentWithMetadata[]
  profileRevenueRange: string | null
}

/**
 * Input for expense aggregation.
 */
export interface ExpenseAggregationInput {
  plDocuments: PLDocumentWithMetadata[]
  overheadCosts: OverheadCosts | null
  employeeCostSummary: EmployeeCostSummary | null
}

/**
 * Converts a profile revenue range string to a numeric value.
 *
 * @param range - Profile annual_revenue_range string (e.g., "1m-2m")
 * @returns Midpoint estimate in dollars, or null if unknown
 */
export function getRevenueFromProfile(range: string | null): number | null {
  if (!range) return null
  return REVENUE_RANGE_MIDPOINTS[range] ?? null
}

/**
 * Aggregates revenue data from available sources.
 *
 * Priority:
 * 1. P&L documents (most recent, highest confidence)
 * 2. Profile estimate (fallback, low confidence)
 *
 * @param input - Available revenue data sources
 * @returns RevenueData with amount and source, or null if no data
 */
export function aggregateRevenueFromSources(
  input: RevenueAggregationInput
): RevenueData | null {
  const { plDocuments, profileRevenueRange } = input

  // Priority 1: Use P&L document revenue
  if (plDocuments.length > 0) {
    // Sort by lastUpdated descending to get most recent (invalid dates sort to end)
    const sortedDocs = [...plDocuments].sort(
      (a, b) => safeGetTime(b.lastUpdated) - safeGetTime(a.lastUpdated)
    )

    const mostRecent = sortedDocs[0]
    const extraction = mostRecent.extraction

    const source: RevenueSource = {
      type: 'pl_document',
      documentId: mostRecent.documentId,
      filename: mostRecent.filename,
      periodStart: extraction.period.startDate || undefined,
      periodEnd: extraction.period.endDate || undefined,
      lastUpdated: mostRecent.lastUpdated,
      confidence: 'high',
    }

    return {
      amount: extraction.revenue.total,
      source,
    }
  }

  // Priority 2: Use profile estimate
  const profileRevenue = getRevenueFromProfile(profileRevenueRange)
  if (profileRevenue !== null) {
    const source: RevenueSource = {
      type: 'profile_estimate',
      lastUpdated: new Date().toISOString(),
      confidence: 'low',
    }

    return {
      amount: profileRevenue,
      source,
    }
  }

  // No revenue data available
  return null
}

/**
 * Aggregates expense data from available sources.
 *
 * Priority:
 * 1. P&L documents (includes all operating expenses)
 * 2. Overhead costs + Employee costs (combined if no P&L)
 *
 * When P&L is available, it's assumed to include payroll and overhead,
 * so we don't double-count by adding those separately.
 *
 * @param input - Available expense data sources
 * @returns ExpenseData with total, categories, and sources
 */
export function aggregateExpensesFromSources(input: ExpenseAggregationInput): ExpenseData {
  const { plDocuments, overheadCosts, employeeCostSummary } = input

  const categories: ExpenseCategory[] = []
  const sources: ExpenseSource[] = []

  // Priority 1: Use P&L document expenses (includes everything)
  if (plDocuments.length > 0) {
    // Sort by lastUpdated descending to get most recent (invalid dates sort to end)
    const sortedDocs = [...plDocuments].sort(
      (a, b) => safeGetTime(b.lastUpdated) - safeGetTime(a.lastUpdated)
    )

    const mostRecent = sortedDocs[0]
    const extraction = mostRecent.extraction

    const documentSource: ExpenseSource = {
      type: 'pl_document',
      documentId: mostRecent.documentId,
      filename: mostRecent.filename,
      lastUpdated: mostRecent.lastUpdated,
      amount: extraction.expenses.total,
    }

    // Add each category from P&L
    for (const cat of extraction.expenses.categories) {
      categories.push({
        name: cat.category,
        amount: cat.amount,
        source: documentSource,
      })
    }

    sources.push(documentSource)

    return {
      total: extraction.expenses.total,
      categories,
      sources,
    }
  }

  // Priority 2: Combine overhead and payroll when no P&L
  let total = 0

  // Add overhead costs
  if (overheadCosts) {
    const monthlyOverhead = calculateTotalMonthlyOverhead(overheadCosts)
    const annualOverhead = Math.round(monthlyOverhead * 12)

    const overheadSource: ExpenseSource = {
      type: 'overhead_costs',
      lastUpdated: overheadCosts.updatedAt,
      amount: annualOverhead,
    }

    categories.push({
      name: 'Overhead Costs',
      amount: annualOverhead,
      source: overheadSource,
    })

    sources.push(overheadSource)
    total += annualOverhead
  }

  // Add employee/payroll costs
  if (employeeCostSummary) {
    const payrollSource: ExpenseSource = {
      type: 'employee_costs',
      lastUpdated: new Date().toISOString(),
      amount: employeeCostSummary.totalFullyLoadedCost,
    }

    categories.push({
      name: 'Payroll & Employee Costs',
      amount: employeeCostSummary.totalFullyLoadedCost,
      source: payrollSource,
    })

    sources.push(payrollSource)
    total += employeeCostSummary.totalFullyLoadedCost
  }

  return {
    total,
    categories,
    sources,
  }
}
