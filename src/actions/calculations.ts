'use server'

/**
 * Server Actions for financial calculations.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 * Story: 5-2-ebitda-calculation
 */

import {
  calculateAllEmployeeCosts,
  calculateCostSummary,
  calculateEBITDA,
  aggregateRevenueFromSources,
  aggregateExpensesFromSources,
} from '@/lib/calculations'
import type {
  EmployeeCostResult,
  EBITDAResult,
  PLDocumentWithMetadata,
} from '@/lib/calculations'
import { createClient } from '@/lib/supabase/server'

import type { ActionResponse } from '@/types'
import type { Employee, EmployeeRow } from '@/types/employees'
import type { OverheadCosts, OverheadCostsRow, SoftwareCost } from '@/types/overhead-costs'
import type { PLExtraction } from '@/lib/documents/extraction-schemas'
import type { DocumentRow } from '@/types/documents'

/**
 * Transforms a database row to the application-level Employee model.
 * Matches pattern from src/actions/employees.ts
 */
function transformRowToEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    employeeId: row.employee_id ?? undefined,
    role: row.role,
    department: row.department ?? undefined,
    employmentType: row.employment_type === 'full-time' ||
      row.employment_type === 'part-time' ||
      row.employment_type === 'contractor'
      ? row.employment_type
      : 'full-time',
    annualSalary: row.annual_salary,
    annualBenefits: row.annual_benefits ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Transforms a database row to the application-level OverheadCosts model.
 * Matches pattern from src/actions/overhead-costs.ts
 */
function transformRowToOverheadCosts(row: OverheadCostsRow): OverheadCosts {
  return {
    id: row.id,
    userId: row.user_id,
    monthlyRent: row.monthly_rent ?? 0,
    monthlyUtilities: row.monthly_utilities ?? 0,
    monthlyInsurance: row.monthly_insurance ?? 0,
    otherMonthlyCosts: row.other_monthly_costs ?? 0,
    softwareCosts: (row.software_costs ?? []).map(
      (sc, idx): SoftwareCost => ({
        id: `software-${idx}-${row.id}`,
        name: sc.name,
        monthlyCost: sc.monthly_cost,
      })
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Creates a synthetic OverheadCosts object from profile estimate.
 * Used when detailed overhead data is not available.
 */
function createOverheadFromEstimate(
  userId: string,
  monthlyEstimate: number
): OverheadCosts {
  const now = new Date().toISOString()
  return {
    id: 'profile-estimate',
    userId,
    monthlyRent: 0,
    monthlyUtilities: 0,
    monthlyInsurance: 0,
    otherMonthlyCosts: monthlyEstimate,
    softwareCosts: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Fetches fully loaded employee costs for the current user.
 *
 * Retrieves employees, overhead costs, and profile data to calculate:
 * - Individual employee cost breakdowns
 * - Summary statistics (totals, averages)
 * - Data source attribution
 *
 * @returns ActionResponse containing EmployeeCostResult or error
 */
export async function getFullyLoadedEmployeeCosts(): Promise<
  ActionResponse<EmployeeCostResult>
> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[CalculationsService]', {
        action: 'getFullyLoadedEmployeeCosts',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    // Fetch employees
    const { data: employeeRows, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (employeesError) {
      console.error('[CalculationsService]', {
        action: 'getFullyLoadedEmployeeCosts',
        error: employeesError.message,
      })
      return { data: null, error: 'Failed to load employees' }
    }

    // Check for no employees
    if (!employeeRows || employeeRows.length === 0) {
      return {
        data: null,
        error: 'No employees found. Add employees first to calculate costs.',
      }
    }

    const employees = (employeeRows as EmployeeRow[]).map(transformRowToEmployee)

    // Fetch overhead costs
    const { data: overheadRow, error: overheadError } = await supabase
      .from('overhead_costs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // PGRST116 = no rows found, not an error
    let overhead: OverheadCosts | null = null
    let overheadSource: 'manual' | 'profile_estimate' | 'none' = 'none'

    if (overheadRow && !overheadError) {
      overhead = transformRowToOverheadCosts(overheadRow as OverheadCostsRow)
      overheadSource = 'manual'
    }

    // Fetch profile for fallback overhead estimate
    const { data: profile } = await supabase
      .from('profiles')
      .select('employee_count, monthly_overhead_estimate')
      .eq('id', user.id)
      .single()

    // Use profile estimate as fallback if no detailed overhead
    if (!overhead && profile?.monthly_overhead_estimate) {
      overhead = createOverheadFromEstimate(user.id, profile.monthly_overhead_estimate)
      overheadSource = 'profile_estimate'
    }

    // Calculate employee costs
    const employeeCosts = calculateAllEmployeeCosts(employees, overhead)

    // Calculate summary
    const hasOverheadData = overhead !== null
    const summary = calculateCostSummary(employeeCosts, hasOverheadData)

    // Determine last updated date (most recent of employees or overhead)
    let lastUpdated = employees[0]?.updatedAt || new Date().toISOString()
    for (const emp of employees) {
      if (emp.updatedAt > lastUpdated) {
        lastUpdated = emp.updatedAt
      }
    }
    if (overhead && overhead.updatedAt > lastUpdated) {
      lastUpdated = overhead.updatedAt
    }

    const result: EmployeeCostResult = {
      employees: employeeCosts,
      summary,
      dataSource: {
        employeesSource: 'manual', // For now, always manual (future: detect CSV imports)
        overheadSource,
        lastUpdated,
      },
    }

    console.log('[CalculationsService]', {
      action: 'getFullyLoadedEmployeeCosts',
      userId: user.id,
      employeeCount: employees.length,
      overheadSource,
    })

    return { data: result, error: null }
  } catch (e) {
    console.error('[CalculationsService]', {
      action: 'getFullyLoadedEmployeeCosts',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to calculate employee costs' }
  }
}

/**
 * Checks if extracted data is a P&L document type.
 */
function isPLDocument(extractedData: Record<string, unknown> | null): boolean {
  if (!extractedData) return false
  const docType = extractedData.documentType as string | undefined
  return docType === 'pl' || docType === 'income_statement' || docType === 'profit_loss'
}

/**
 * Fetches EBITDA calculation for the current user.
 *
 * Aggregates data from multiple sources:
 * - P&L documents (highest priority for revenue and expenses)
 * - Overhead costs (manual entry)
 * - Employee costs (from Story 5.1 calculation)
 * - Profile estimates (fallback for revenue)
 *
 * @returns ActionResponse containing EBITDAResult or error
 */
export async function getEBITDA(): Promise<ActionResponse<EBITDAResult>> {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[CalculationsService]', {
        action: 'getEBITDA',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    const warnings: string[] = []

    // Fetch P&L documents
    const { data: documentRows } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })

    const plDocuments: PLDocumentWithMetadata[] = []
    if (documentRows) {
      for (const row of documentRows as DocumentRow[]) {
        if (isPLDocument(row.extracted_data)) {
          plDocuments.push({
            documentId: row.id,
            filename: row.filename,
            lastUpdated: row.updated_at,
            extraction: row.extracted_data as unknown as PLExtraction,
          })
        }
      }
    }

    // Fetch profile for revenue estimate fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('annual_revenue_range, monthly_overhead_estimate')
      .eq('id', user.id)
      .single()

    // Fetch overhead costs
    const { data: overheadRow } = await supabase
      .from('overhead_costs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let overhead: OverheadCosts | null = null
    if (overheadRow) {
      overhead = transformRowToOverheadCosts(overheadRow as OverheadCostsRow)
    }

    // Get employee costs (uses existing calculation from Story 5.1)
    const employeeCostsResult = await getFullyLoadedEmployeeCosts()
    const employeeCostSummary = employeeCostsResult.data?.summary ?? null

    // Aggregate revenue from sources
    const revenueData = aggregateRevenueFromSources({
      plDocuments,
      profileRevenueRange: profile?.annual_revenue_range ?? null,
    })

    // Track data completeness
    const hasRevenueData = revenueData !== null
    const hasPayrollData = employeeCostSummary !== null
    const hasOverheadData = overhead !== null
    const hasPLData = plDocuments.length > 0

    // Add warnings for missing data
    if (!hasRevenueData) {
      warnings.push(
        'No revenue data found. Upload a P&L statement or complete your profile with revenue information.'
      )
    } else if (revenueData.source.type === 'profile_estimate') {
      warnings.push(
        'Using estimated revenue from your profile. Upload a P&L statement for more accurate results.'
      )
    }

    if (!hasPLData && !hasOverheadData && !hasPayrollData) {
      warnings.push(
        'No expense data available. Upload a P&L statement or enter overhead costs and employees.'
      )
    }

    // Handle case where we have no revenue data at all
    if (!hasRevenueData) {
      return {
        data: null,
        error: 'No revenue data found. Upload a P&L statement or complete your profile.',
      }
    }

    // Aggregate expenses from sources
    const expenseData = aggregateExpensesFromSources({
      plDocuments,
      overheadCosts: hasPLData ? null : overhead, // Don't double-count if P&L has expenses
      employeeCostSummary: hasPLData ? null : employeeCostSummary, // Don't double-count payroll
    })

    // Calculate EBITDA
    const breakdown = calculateEBITDA(revenueData, expenseData)

    // Add warning for negative EBITDA
    if (breakdown.ebitda < 0) {
      warnings.push(
        'Your EBITDA is negative, indicating an operating loss. Consider reviewing expenses or strategies to increase revenue.'
      )
    }

    // Build result
    const result: EBITDAResult = {
      breakdown,
      dataCompleteness: {
        hasRevenueData,
        hasExpenseData: expenseData.total > 0,
        hasPayrollData,
        hasOverheadData,
      },
      warnings,
      lastUpdated: new Date().toISOString(),
    }

    console.log('[CalculationsService]', {
      action: 'getEBITDA',
      userId: user.id,
      plDocCount: plDocuments.length,
      hasOverhead: hasOverheadData,
      hasPayroll: hasPayrollData,
      ebitda: breakdown.ebitda,
      margin: breakdown.ebitdaMargin,
    })

    return { data: result, error: null }
  } catch (e) {
    console.error('[CalculationsService]', {
      action: 'getEBITDA',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to calculate EBITDA' }
  }
}
