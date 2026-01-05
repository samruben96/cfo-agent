/**
 * Barrel exports for calculations module.
 * Story: 5-1-fully-loaded-employee-cost-calculation
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
