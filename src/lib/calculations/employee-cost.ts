/**
 * Employee cost calculation engine.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 *
 * Calculates the fully loaded cost of employees including:
 * - Base salary
 * - Payroll taxes (employer FICA: 7.65%)
 * - Benefits
 * - Allocated overhead (rent, utilities, software, etc.)
 */

import type { Employee } from '@/types/employees'
import type { OverheadCosts } from '@/types/overhead-costs'

import type { EmployeeCostBreakdown } from './types'

/**
 * Employer-side FICA tax rate.
 * - Social Security: 6.2% (on first $168,600 in 2024)
 * - Medicare: 1.45% (no cap)
 * Total: 7.65%
 *
 * Note: For MVP, we use simplified rate without SS wage cap.
 * Future enhancement could add SUTA, FUTA, etc.
 */
export const PAYROLL_TAX_RATE = 0.0765

/**
 * Calculates total monthly overhead from all overhead components.
 *
 * @param overhead - Overhead costs record (or null if none)
 * @returns Total monthly overhead in dollars
 */
export function calculateTotalMonthlyOverhead(overhead: OverheadCosts | null): number {
  if (!overhead) return 0

  const softwareTotal = overhead.softwareCosts.reduce(
    (sum, sw) => sum + sw.monthlyCost,
    0
  )

  return (
    overhead.monthlyRent +
    overhead.monthlyUtilities +
    overhead.monthlyInsurance +
    overhead.otherMonthlyCosts +
    softwareTotal
  )
}

/**
 * Calculates the fully loaded cost for a single employee.
 *
 * Formula:
 * fullyLoadedCost = baseSalary + payrollTaxes + benefits + allocatedOverhead
 *
 * Where:
 * - baseSalary = employee.annualSalary
 * - payrollTaxes = baseSalary × 0.0765 (employer FICA)
 * - benefits = employee.annualBenefits (or 0 if not provided)
 * - allocatedOverhead = (totalMonthlyOverhead × 12) / totalHeadcount
 *
 * @param employee - Employee record
 * @param overhead - Overhead costs (or null if none available)
 * @param headcount - Total headcount for overhead allocation
 * @returns Complete cost breakdown for the employee
 */
export function calculateFullyLoadedCost(
  employee: Employee,
  overhead: OverheadCosts | null,
  headcount: number
): EmployeeCostBreakdown {
  const baseSalary = employee.annualSalary
  const payrollTaxes = Math.round(baseSalary * PAYROLL_TAX_RATE)
  const benefits = employee.annualBenefits

  // Calculate allocated overhead
  const monthlyOverhead = calculateTotalMonthlyOverhead(overhead)
  const annualOverhead = monthlyOverhead * 12
  // Use Math.round to avoid floating point issues
  const allocatedOverhead = headcount > 0 ? Math.round(annualOverhead / headcount) : 0

  // Sum all cost components
  const fullyLoadedCost = baseSalary + payrollTaxes + benefits + allocatedOverhead

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    department: employee.department,
    employmentType: employee.employmentType,

    baseSalary,
    payrollTaxes,
    benefits,
    allocatedOverhead,

    fullyLoadedCost,
    annualCost: fullyLoadedCost,
    monthlyCost: fullyLoadedCost / 12,
  }
}
