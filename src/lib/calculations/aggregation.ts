/**
 * Aggregation functions for employee cost calculations.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 *
 * Provides batch processing of employee costs and summary statistics.
 */

import type { Employee } from '@/types/employees'
import type { OverheadCosts } from '@/types/overhead-costs'

import { calculateFullyLoadedCost } from './employee-cost'
import type { EmployeeCostBreakdown, EmployeeCostSummary } from './types'

/**
 * Calculates fully loaded costs for all employees in a batch.
 * Overhead is split evenly across all employees.
 *
 * @param employees - Array of employee records
 * @param overhead - Overhead costs (or null if none available)
 * @returns Array of cost breakdowns, one per employee
 */
export function calculateAllEmployeeCosts(
  employees: Employee[],
  overhead: OverheadCosts | null
): EmployeeCostBreakdown[] {
  const headcount = employees.length

  return employees.map((employee) =>
    calculateFullyLoadedCost(employee, overhead, headcount)
  )
}

/**
 * Calculates summary statistics from a set of employee cost breakdowns.
 * Tracks data completeness and generates warnings for missing data.
 *
 * @param employeeCosts - Array of employee cost breakdowns
 * @param hasOverheadData - Whether overhead data was available
 * @returns Summary statistics with totals, averages, and completeness info
 */
export function calculateCostSummary(
  employeeCosts: EmployeeCostBreakdown[],
  hasOverheadData: boolean
): EmployeeCostSummary {
  const totalHeadcount = employeeCosts.length
  const missingDataWarnings: string[] = []

  // Handle empty array case
  if (totalHeadcount === 0) {
    return {
      totalHeadcount: 0,
      totalFullyLoadedCost: 0,
      averageFullyLoadedCost: 0,
      totalBaseSalary: 0,
      totalPayrollTaxes: 0,
      totalBenefits: 0,
      totalOverheadAllocated: 0,
      hasOverheadData,
      hasBenefitsData: false,
      missingDataWarnings: hasOverheadData
        ? []
        : ['Overhead data not available. Allocated overhead is not included in calculations.'],
    }
  }

  // Calculate totals
  const totalBaseSalary = employeeCosts.reduce((sum, e) => sum + e.baseSalary, 0)
  const totalPayrollTaxes = employeeCosts.reduce((sum, e) => sum + e.payrollTaxes, 0)
  const totalBenefits = employeeCosts.reduce((sum, e) => sum + e.benefits, 0)
  const totalOverheadAllocated = employeeCosts.reduce((sum, e) => sum + e.allocatedOverhead, 0)
  const totalFullyLoadedCost = employeeCosts.reduce((sum, e) => sum + e.fullyLoadedCost, 0)

  // Calculate average
  const averageFullyLoadedCost = totalFullyLoadedCost / totalHeadcount

  // Track data completeness
  const employeesWithBenefits = employeeCosts.filter((e) => e.benefits > 0)
  const hasBenefitsData = employeesWithBenefits.length > 0
  const employeesWithoutBenefits = totalHeadcount - employeesWithBenefits.length

  // Generate warnings
  if (!hasOverheadData) {
    missingDataWarnings.push(
      'Overhead data not available. Allocated overhead is not included in calculations.'
    )
  }

  if (employeesWithoutBenefits > 0 && totalHeadcount > 0) {
    missingDataWarnings.push(
      `Benefits not specified for ${employeesWithoutBenefits} employee(s).`
    )
  }

  return {
    totalHeadcount,
    totalFullyLoadedCost,
    averageFullyLoadedCost,
    totalBaseSalary,
    totalPayrollTaxes,
    totalBenefits,
    totalOverheadAllocated,
    hasOverheadData,
    hasBenefitsData,
    missingDataWarnings,
  }
}
