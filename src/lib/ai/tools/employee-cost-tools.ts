/**
 * AI tools for employee cost queries.
 * Story: 5-1-fully-loaded-employee-cost-calculation
 *
 * Provides the AI with ability to:
 * - Get fully loaded employee costs
 * - Explain calculation methodology
 */

import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { getFullyLoadedEmployeeCosts } from '@/actions/calculations'
import { formatCurrency } from '@/lib/utils/format-currency'

import type { EmployeeCostResult } from '@/lib/calculations'

/**
 * Result type for employee cost tools
 */
export interface EmployeeCostToolResult {
  success: boolean
  message: string
  data?: EmployeeCostResult | null
}

// Zod schema for get_employee_costs tool
const employeeCostsSchema = z.object({
  includeDetails: z
    .boolean()
    .optional()
    .describe(
      'Include individual employee breakdowns. Set to true for detailed per-employee costs, false for summary only.'
    ),
})

/**
 * Formats a cost summary into a human-readable message.
 */
function formatCostSummaryMessage(result: EmployeeCostResult): string {
  const { summary, dataSource } = result
  const lines: string[] = []

  lines.push(`📊 **Employee Cost Summary**\n`)
  lines.push(`**Total Headcount:** ${summary.totalHeadcount}`)
  lines.push(`**Total Fully Loaded Cost:** ${formatCurrency(summary.totalFullyLoadedCost)}/year`)
  lines.push(`**Average Per Employee:** ${formatCurrency(summary.averageFullyLoadedCost)}/year\n`)

  lines.push(`**Cost Breakdown:**`)
  lines.push(`- Base Salaries: ${formatCurrency(summary.totalBaseSalary)}`)
  lines.push(`- Payroll Taxes (7.65% FICA): ${formatCurrency(summary.totalPayrollTaxes)}`)
  lines.push(`- Benefits: ${formatCurrency(summary.totalBenefits)}`)
  lines.push(`- Allocated Overhead: ${formatCurrency(summary.totalOverheadAllocated)}\n`)

  // Data source attribution
  lines.push(`**Data Sources:**`)
  lines.push(`- Employee data: ${dataSource.employeesSource}`)
  lines.push(`- Overhead data: ${dataSource.overheadSource}`)
  lines.push(`- Last updated: ${new Date(dataSource.lastUpdated).toLocaleDateString()}`)

  // Warnings
  if (summary.missingDataWarnings.length > 0) {
    lines.push(`\n**⚠️ Notes:**`)
    for (const warning of summary.missingDataWarnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join('\n')
}

/**
 * Formats a detailed employee breakdown into a human-readable message.
 */
function formatDetailedBreakdown(result: EmployeeCostResult): string {
  const { employees, summary, dataSource } = result
  const lines: string[] = []

  lines.push(`📊 **Fully Loaded Employee Costs**\n`)

  // Individual employee breakdowns
  for (const emp of employees) {
    lines.push(`### ${emp.employeeName}`)
    lines.push(`*${emp.role}${emp.department ? ` • ${emp.department}` : ''} • ${emp.employmentType}*\n`)
    lines.push(`| Component | Annual | Monthly |`)
    lines.push(`|-----------|-------:|--------:|`)
    lines.push(`| Base Salary | ${formatCurrency(emp.baseSalary)} | ${formatCurrency(emp.baseSalary / 12)} |`)
    lines.push(`| Payroll Taxes | ${formatCurrency(emp.payrollTaxes)} | ${formatCurrency(emp.payrollTaxes / 12)} |`)
    lines.push(`| Benefits | ${formatCurrency(emp.benefits)} | ${formatCurrency(emp.benefits / 12)} |`)
    lines.push(`| Overhead Allocation | ${formatCurrency(emp.allocatedOverhead)} | ${formatCurrency(emp.allocatedOverhead / 12)} |`)
    lines.push(`| **Total** | **${formatCurrency(emp.fullyLoadedCost)}** | **${formatCurrency(emp.monthlyCost)}** |`)
    lines.push('')
  }

  // Summary
  lines.push(`---\n`)
  lines.push(`### Summary`)
  lines.push(`- **Total Headcount:** ${summary.totalHeadcount}`)
  lines.push(`- **Total Fully Loaded Cost:** ${formatCurrency(summary.totalFullyLoadedCost)}/year`)
  lines.push(`- **Average Per Employee:** ${formatCurrency(summary.averageFullyLoadedCost)}/year`)

  // Data source attribution
  lines.push(`\n**Data Sources:** Employee data: ${dataSource.employeesSource}, Overhead: ${dataSource.overheadSource}`)

  // Warnings
  if (summary.missingDataWarnings.length > 0) {
    lines.push(`\n**⚠️ Notes:**`)
    for (const warning of summary.missingDataWarnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join('\n')
}

/**
 * Creates employee cost tools for the AI to use during conversations.
 *
 * @returns Object containing employee cost tools
 */
export function createEmployeeCostTools() {
  return {
    get_employee_costs: tool({
      description: `Get fully loaded employee cost breakdown including salary, payroll taxes, benefits, and allocated overhead.

Use this tool when the user asks:
- "What does each employee cost me?"
- "Show me fully loaded costs"
- "What's my total payroll cost?"
- "How much do my employees cost?"
- "What's the real cost of my team?"
- "Show me employee cost breakdown"

The tool calculates:
- Base salary
- Payroll taxes (employer FICA: 7.65%)
- Benefits (if provided)
- Allocated overhead (rent, utilities, software, etc. split across headcount)

Returns detailed per-employee breakdowns or summary only based on includeDetails parameter.`,
      inputSchema: zodSchema(employeeCostsSchema),
      execute: async ({ includeDetails = true }): Promise<EmployeeCostToolResult> => {
        const result = await getFullyLoadedEmployeeCosts()

        if (result.error) {
          return {
            success: false,
            message: result.error,
            data: null,
          }
        }

        const data = result.data!
        const message = includeDetails
          ? formatDetailedBreakdown(data)
          : formatCostSummaryMessage(data)

        return {
          success: true,
          message,
          data: includeDetails ? data : { ...data, employees: [] },
        }
      },
    }),

    explain_employee_cost_formula: tool({
      description: `Explain how fully loaded employee cost is calculated.

Use this tool when the user asks:
- "How did you calculate this?"
- "What goes into employee cost?"
- "Explain the formula"
- "What is fully loaded cost?"
- "How does overhead allocation work?"`,
      inputSchema: zodSchema(z.object({})),
      execute: async (): Promise<EmployeeCostToolResult> => {
        const message = `## Fully Loaded Employee Cost Formula

**Formula:**
\`\`\`
Fully Loaded Cost = Base Salary + Payroll Taxes + Benefits + Allocated Overhead
\`\`\`

**Components:**

1. **Base Salary** - The employee's annual salary

2. **Payroll Taxes** - Employer-side FICA taxes (7.65%)
   - Social Security: 6.2%
   - Medicare: 1.45%

3. **Benefits** - Annual benefits cost you provide (health insurance, retirement, etc.)

4. **Allocated Overhead** - Fixed costs split across headcount
   - Formula: (Monthly Overhead × 12) ÷ Total Employees
   - Includes: rent, utilities, insurance, software, and other monthly costs

**Example:**
For an employee earning $100,000 with $15,000 in benefits and $87,600 annual overhead split across 5 employees:
- Base Salary: $100,000
- Payroll Taxes: $7,650 (7.65%)
- Benefits: $15,000
- Overhead: $17,520 ($87,600 ÷ 5)
- **Total: $140,170/year ($11,681/month)**

This represents the true cost to employ this person, not just their salary.`

        return {
          success: true,
          message,
          data: null,
        }
      },
    }),
  }
}

/**
 * Type helper for the tools object returned by createEmployeeCostTools
 */
export type EmployeeCostTools = ReturnType<typeof createEmployeeCostTools>
