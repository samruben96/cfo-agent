/**
 * Types for employee cost calculations.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 */

import type { EmploymentType } from '@/types/employees'

/**
 * Cost breakdown for a single employee.
 * Includes all components of the fully loaded cost.
 */
export interface EmployeeCostBreakdown {
  /** Employee's database ID */
  employeeId: string
  /** Employee name for display */
  employeeName: string
  /** Employee role/title */
  role: string
  /** Optional department */
  department?: string
  /** Employment type (full-time, part-time, contractor) */
  employmentType: EmploymentType

  // Cost components
  /** Base annual salary */
  baseSalary: number
  /** Employer payroll taxes (FICA: 7.65%) */
  payrollTaxes: number
  /** Annual benefits cost */
  benefits: number
  /** Allocated annual overhead (total overhead / headcount) */
  allocatedOverhead: number

  // Totals
  /** Total fully loaded cost (sum of all components) */
  fullyLoadedCost: number
  /** Same as fullyLoadedCost for clarity */
  annualCost: number
  /** Monthly cost (fullyLoadedCost / 12) */
  monthlyCost: number
}

/**
 * Summary statistics across all employees.
 */
export interface EmployeeCostSummary {
  /** Total number of employees */
  totalHeadcount: number
  /** Sum of all fully loaded costs */
  totalFullyLoadedCost: number
  /** Average fully loaded cost per employee */
  averageFullyLoadedCost: number
  /** Sum of all base salaries */
  totalBaseSalary: number
  /** Sum of all payroll taxes */
  totalPayrollTaxes: number
  /** Sum of all benefits */
  totalBenefits: number
  /** Sum of all overhead allocations */
  totalOverheadAllocated: number

  // Data completeness
  /** Whether overhead data was available */
  hasOverheadData: boolean
  /** Whether any employees have benefits data */
  hasBenefitsData: boolean
  /** Warnings about missing or incomplete data */
  missingDataWarnings: string[]
}

/**
 * Complete result including all employee breakdowns and summary.
 */
export interface EmployeeCostResult {
  /** Individual employee cost breakdowns */
  employees: EmployeeCostBreakdown[]
  /** Aggregate summary statistics */
  summary: EmployeeCostSummary

  /** Data source attribution for transparency */
  dataSource: {
    /** Source of employee data */
    employeesSource: 'manual' | 'csv_import' | 'mixed'
    /** Source of overhead data */
    overheadSource: 'manual' | 'profile_estimate' | 'none'
    /** When data was last updated */
    lastUpdated: string
  }
}
