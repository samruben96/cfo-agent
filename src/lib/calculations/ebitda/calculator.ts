/**
 * EBITDA calculation engine.
 * Story: 5-2-ebitda-calculation
 *
 * EBITDA = Earnings Before Interest, Taxes, Depreciation, Amortization
 * For MVP, we use simplified EBITDA: Revenue - Operating Expenses
 */

import type { EBITDABreakdown, RevenueData, ExpenseData } from './types'

/**
 * Calculates EBITDA margin as a percentage.
 * Rounds to 2 decimal places for display.
 *
 * Formula: (EBITDA / Revenue) * 100
 *
 * @param ebitda - EBITDA value (can be negative for losses)
 * @param revenue - Total revenue (must be > 0 for valid calculation)
 * @returns EBITDA margin as percentage (e.g., 25.5 = 25.5%), 0 if revenue is 0
 */
export function calculateEBITDAMargin(ebitda: number, revenue: number): number {
  // Avoid division by zero
  if (revenue === 0) return 0

  // Calculate margin and round to 2 decimal places
  const margin = (ebitda / revenue) * 100
  return Math.round(margin * 100) / 100
}

/**
 * Calculates EBITDA and returns complete breakdown.
 *
 * Formula: EBITDA = Revenue - Operating Expenses
 *
 * @param revenue - Revenue data with amount and source
 * @param expenses - Expense data with total, categories, and sources
 * @returns Complete EBITDA breakdown with all components
 */
export function calculateEBITDA(
  revenue: RevenueData,
  expenses: ExpenseData
): EBITDABreakdown {
  // Calculate EBITDA (use Math.round to avoid floating point issues)
  const ebitda = Math.round(revenue.amount - expenses.total)

  // Calculate margin
  const ebitdaMargin = calculateEBITDAMargin(ebitda, revenue.amount)

  // Build period information from revenue source if available
  const period =
    revenue.source.periodStart && revenue.source.periodEnd
      ? {
          startDate: revenue.source.periodStart,
          endDate: revenue.source.periodEnd,
        }
      : undefined

  return {
    // Revenue
    revenue: revenue.amount,
    revenueSource: revenue.source,

    // Expenses
    totalOperatingExpenses: expenses.total,
    expenseCategories: expenses.categories,
    expenseSources: expenses.sources,

    // EBITDA calculations
    ebitda,
    ebitdaMargin,

    // Period
    period,
  }
}
