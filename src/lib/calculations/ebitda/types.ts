/**
 * Types for EBITDA calculations.
 * Story: 5-2-ebitda-calculation
 *
 * EBITDA = Earnings Before Interest, Taxes, Depreciation, Amortization
 * Simplified for MVP: Revenue - Operating Expenses
 */

/**
 * Source of revenue data for attribution.
 * Tracks where the revenue figure came from for transparency.
 */
export interface RevenueSource {
  /** Type of data source */
  type: 'pl_document' | 'profile_estimate'
  /** Document ID if from P&L document */
  documentId?: string
  /** Filename if from P&L document */
  filename?: string
  /** Period start date if known */
  periodStart?: string
  /** Period end date if known */
  periodEnd?: string
  /** When the source data was last updated */
  lastUpdated: string
  /** Confidence level based on data source */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Source of expense data for attribution.
 * Tracks where each expense figure came from.
 */
export interface ExpenseSource {
  /** Type of data source */
  type: 'pl_document' | 'overhead_costs' | 'employee_costs'
  /** Document ID if from P&L document */
  documentId?: string
  /** Filename if from P&L document */
  filename?: string
  /** When the source data was last updated */
  lastUpdated: string
  /** Amount from this source */
  amount: number
}

/**
 * Individual expense category breakdown.
 * Used to show expenses by category with source attribution.
 */
export interface ExpenseCategory {
  /** Category name (e.g., "Payroll", "Rent", "Marketing") */
  name: string
  /** Amount for this category */
  amount: number
  /** Source of this category's data */
  source: ExpenseSource
}

/**
 * Complete EBITDA breakdown with all components.
 * Core result of the EBITDA calculation.
 */
export interface EBITDABreakdown {
  // Revenue section
  /** Total revenue figure */
  revenue: number
  /** Source of revenue data */
  revenueSource: RevenueSource

  // Expenses section
  /** Total operating expenses */
  totalOperatingExpenses: number
  /** Breakdown by expense category */
  expenseCategories: ExpenseCategory[]
  /** All expense data sources */
  expenseSources: ExpenseSource[]

  // EBITDA calculations
  /** EBITDA value (Revenue - Operating Expenses) */
  ebitda: number
  /** EBITDA margin as percentage (e.g., 25.5 = 25.5%) */
  ebitdaMargin: number

  // Period information
  /** Reporting period if known */
  period?: {
    startDate: string
    endDate: string
  }
}

/**
 * Data completeness tracking for transparency.
 * Helps users understand what data was available for calculation.
 */
export interface DataCompleteness {
  /** Whether revenue data was found */
  hasRevenueData: boolean
  /** Whether expense data was found */
  hasExpenseData: boolean
  /** Whether payroll data was included */
  hasPayrollData: boolean
  /** Whether overhead data was included */
  hasOverheadData: boolean
}

/**
 * Complete EBITDA result with all metadata.
 * Full result returned to the user with data quality info.
 */
export interface EBITDAResult {
  /** The EBITDA calculation breakdown */
  breakdown: EBITDABreakdown
  /** Data completeness information */
  dataCompleteness: DataCompleteness
  /** Warnings about missing or estimated data */
  warnings: string[]
  /** When this calculation was generated */
  lastUpdated: string
}

/**
 * Revenue range mapping for profile estimates.
 * Maps profile annual_revenue_range strings to numeric midpoints.
 */
export const REVENUE_RANGE_MIDPOINTS: Record<string, number> = {
  'under-250k': 125000, // $0-$250K → midpoint $125K
  '250k-500k': 375000, // $250K-$500K → midpoint $375K
  '500k-1m': 750000, // $500K-$1M → midpoint $750K
  '1m-2m': 1500000, // $1M-$2M → midpoint $1.5M
  '2m-5m': 3500000, // $2M-$5M → midpoint $3.5M
  '5m-plus': 7500000, // $5M+ → estimate $7.5M
}

/**
 * Input types for EBITDA calculation functions.
 * These simplify the function signatures.
 */
export interface RevenueData {
  /** Total revenue amount */
  amount: number
  /** Source attribution */
  source: RevenueSource
}

export interface ExpenseData {
  /** Total expenses amount */
  total: number
  /** Categories if available */
  categories: ExpenseCategory[]
  /** All contributing sources */
  sources: ExpenseSource[]
}
