/**
 * Barrel exports for calculations module.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 * Story: 5-2-ebitda-calculation
 */

// Core calculation functions
export {
  calculateFullyLoadedCost,
  calculateTotalMonthlyOverhead,
  PAYROLL_TAX_RATE,
} from './employee-cost'

// Aggregation functions
export { calculateAllEmployeeCosts, calculateCostSummary } from './aggregation'

// Types
export type {
  EmployeeCostBreakdown,
  EmployeeCostSummary,
  EmployeeCostResult,
} from './types'

// EBITDA exports (Story 5.2)
export {
  calculateEBITDA,
  calculateEBITDAMargin,
  aggregateRevenueFromSources,
  aggregateExpensesFromSources,
  getRevenueFromProfile,
  REVENUE_RANGE_MIDPOINTS,
} from './ebitda'

export type {
  RevenueSource,
  ExpenseSource,
  ExpenseCategory,
  EBITDABreakdown,
  DataCompleteness,
  EBITDAResult,
  RevenueData,
  ExpenseData,
  PLDocumentWithMetadata,
  RevenueAggregationInput,
  ExpenseAggregationInput,
} from './ebitda'
