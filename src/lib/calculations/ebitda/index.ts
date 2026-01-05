/**
 * Barrel exports for EBITDA calculations module.
 * Story: 5-2-ebitda-calculation
 */

// Core calculation functions
export { calculateEBITDA, calculateEBITDAMargin } from './calculator'

// Aggregation functions
export {
  aggregateRevenueFromSources,
  aggregateExpensesFromSources,
  getRevenueFromProfile,
} from './aggregation'

// Types
export type {
  RevenueSource,
  ExpenseSource,
  ExpenseCategory,
  EBITDABreakdown,
  DataCompleteness,
  EBITDAResult,
  RevenueData,
  ExpenseData,
} from './types'

export { REVENUE_RANGE_MIDPOINTS } from './types'

// Aggregation input types
export type {
  PLDocumentWithMetadata,
  RevenueAggregationInput,
  ExpenseAggregationInput,
} from './aggregation'
