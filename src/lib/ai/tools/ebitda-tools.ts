/**
 * AI tools for EBITDA queries.
 * Story: 5-2-ebitda-calculation
 *
 * Provides the AI with ability to:
 * - Get EBITDA calculation with breakdown
 * - Explain EBITDA formula and components
 */

import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { getEBITDA } from '@/actions/calculations'
import { formatCurrency } from '@/lib/utils/format-currency'

import type { EBITDAResult } from '@/lib/calculations'

/**
 * Result type for EBITDA tools
 */
export interface EBITDAToolResult {
  success: boolean
  message: string
  data?: EBITDAResult | null
}

// Zod schema for get_ebitda tool
const ebitdaSchema = z.object({
  includeDetails: z
    .boolean()
    .optional()
    .describe(
      'Include detailed expense breakdown by category. Set to true for full breakdown, false for summary only.'
    ),
})

/**
 * Formats EBITDA result into a summary message.
 */
export function formatEBITDAMessage(result: EBITDAResult): string {
  const { breakdown, dataCompleteness, warnings } = result
  const lines: string[] = []

  lines.push(`📊 **EBITDA Summary**\n`)

  // EBITDA headline
  lines.push(`**EBITDA:** ${formatCurrency(breakdown.ebitda)}`)
  lines.push(`**EBITDA Margin:** ${breakdown.ebitdaMargin}%\n`)

  // Formula breakdown
  lines.push(`**Calculation:**`)
  lines.push(`| Component | Amount |`)
  lines.push(`|-----------|-------:|`)
  lines.push(`| Revenue | ${formatCurrency(breakdown.revenue)} |`)
  lines.push(`| Operating Expenses | (${formatCurrency(breakdown.totalOperatingExpenses)}) |`)
  lines.push(`| **EBITDA** | **${formatCurrency(breakdown.ebitda)}** |`)
  lines.push('')

  // Data source
  lines.push(`**Revenue Source:** ${breakdown.revenueSource.filename || breakdown.revenueSource.type}`)
  lines.push(`**Data Confidence:** ${breakdown.revenueSource.confidence}`)

  // Period if available
  if (breakdown.period) {
    lines.push(`**Period:** ${breakdown.period.startDate} to ${breakdown.period.endDate}`)
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push(`\n**⚠️ Notes:**`)
    for (const warning of warnings) {
      lines.push(`- ${warning}`)
    }
  }

  // Data completeness
  const complete = dataCompleteness
  if (!complete.hasPayrollData || !complete.hasOverheadData) {
    lines.push(`\n**💡 For more accurate results:**`)
    if (!complete.hasPayrollData) {
      lines.push(`- Add employee data at /data/employees`)
    }
    if (!complete.hasOverheadData) {
      lines.push(`- Add overhead costs at /data/overhead`)
    }
  }

  return lines.join('\n')
}

/**
 * Formats EBITDA result with detailed expense breakdown.
 */
export function formatEBITDADetailedMessage(result: EBITDAResult): string {
  const { breakdown, dataCompleteness, warnings } = result
  const lines: string[] = []

  lines.push(`📊 **EBITDA Detailed Breakdown**\n`)

  // Revenue section
  lines.push(`## Revenue`)
  lines.push(`**Total Revenue:** ${formatCurrency(breakdown.revenue)}`)
  lines.push(`*Source: ${breakdown.revenueSource.filename || breakdown.revenueSource.type} (${breakdown.revenueSource.confidence} confidence)*\n`)

  // Expense section with categories
  lines.push(`## Operating Expenses`)
  if (breakdown.expenseCategories.length > 0) {
    lines.push(`| Category | Amount | % of Expenses |`)
    lines.push(`|----------|-------:|--------------:|`)

    for (const cat of breakdown.expenseCategories) {
      const percentage = breakdown.totalOperatingExpenses > 0
        ? Math.round((cat.amount / breakdown.totalOperatingExpenses) * 100)
        : 0
      lines.push(`| ${cat.name} | ${formatCurrency(cat.amount)} | ${percentage}% |`)
    }

    lines.push(`| **Total** | **${formatCurrency(breakdown.totalOperatingExpenses)}** | **100%** |`)
  } else {
    lines.push(`**Total Operating Expenses:** ${formatCurrency(breakdown.totalOperatingExpenses)}`)
  }

  lines.push('')

  // EBITDA result
  lines.push(`## EBITDA`)
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|------:|`)
  lines.push(`| Revenue | ${formatCurrency(breakdown.revenue)} |`)
  lines.push(`| - Operating Expenses | (${formatCurrency(breakdown.totalOperatingExpenses)}) |`)
  lines.push(`| **= EBITDA** | **${formatCurrency(breakdown.ebitda)}** |`)
  lines.push(`| EBITDA Margin | ${breakdown.ebitdaMargin}% |`)
  lines.push('')

  // Period if available
  if (breakdown.period) {
    lines.push(`**Reporting Period:** ${breakdown.period.startDate} to ${breakdown.period.endDate}`)
  }

  // Data sources
  lines.push(`\n**Data Sources Used:**`)
  const sourceTypes = new Set<string>()
  if (breakdown.revenueSource.type === 'pl_document') {
    sourceTypes.add(`P&L Document (${breakdown.revenueSource.filename})`)
  } else {
    sourceTypes.add('Profile Estimate')
  }

  for (const source of breakdown.expenseSources) {
    if (source.type === 'pl_document') {
      sourceTypes.add(`P&L Document (${source.filename})`)
    } else if (source.type === 'overhead_costs') {
      sourceTypes.add('Overhead Costs (manual entry)')
    } else if (source.type === 'employee_costs') {
      sourceTypes.add('Employee Costs (calculated)')
    }
  }

  for (const sourceType of sourceTypes) {
    lines.push(`- ${sourceType}`)
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push(`\n**⚠️ Notes:**`)
    for (const warning of warnings) {
      lines.push(`- ${warning}`)
    }
  }

  // Recommendations
  const complete = dataCompleteness
  if (!complete.hasPayrollData || !complete.hasOverheadData) {
    lines.push(`\n**💡 Recommendations:**`)
    if (!complete.hasPayrollData) {
      lines.push(`- Add employee data for more complete expense tracking`)
    }
    if (!complete.hasOverheadData) {
      lines.push(`- Add overhead costs for better accuracy`)
    }
  }

  return lines.join('\n')
}

/**
 * Creates EBITDA tools for the AI to use during conversations.
 *
 * @returns Object containing EBITDA tools
 */
export function createEBITDATools() {
  return {
    get_ebitda: tool({
      description: `Get EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization) calculation.

Use this tool when the user asks:
- "What's my EBITDA?"
- "Show me profitability"
- "What are my earnings?"
- "Calculate operating profit"
- "Am I making money?"
- "What's my operating margin?"
- "How profitable is my agency?"
- "Show me my profit"

Returns revenue, operating expenses breakdown, EBITDA value, and EBITDA margin percentage.

For MVP, EBITDA is calculated as: Revenue - Operating Expenses
Operating expenses include payroll, overhead, and other operating costs (excluding interest, taxes, depreciation, and amortization).`,
      inputSchema: zodSchema(ebitdaSchema),
      execute: async ({ includeDetails = true }): Promise<EBITDAToolResult> => {
        const result = await getEBITDA()

        if (result.error) {
          return {
            success: false,
            message: result.error,
            data: null,
          }
        }

        const data = result.data!
        const message = includeDetails
          ? formatEBITDADetailedMessage(data)
          : formatEBITDAMessage(data)

        return {
          success: true,
          message,
          data,
        }
      },
    }),

    explain_ebitda_formula: tool({
      description: `Explain what EBITDA means and how it's calculated.

Use this tool when the user asks:
- "What is EBITDA?"
- "How is EBITDA calculated?"
- "What does EBITDA mean?"
- "Explain the EBITDA formula"
- "Why is EBITDA important?"
- "What's a good EBITDA margin?"`,
      inputSchema: zodSchema(z.object({})),
      execute: async (): Promise<EBITDAToolResult> => {
        const message = `## What is EBITDA?

**EBITDA** stands for **Earnings Before Interest, Taxes, Depreciation, and Amortization**.

It's a measure of your agency's core operating profitability—how much money you make from running your business, before accounting for:
- Interest payments on loans
- Tax obligations
- Non-cash expenses (depreciation, amortization)

### Formula

\`\`\`
EBITDA = Revenue - Operating Expenses
\`\`\`

**Or equivalently:**
\`\`\`
EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization
\`\`\`

### EBITDA Margin

\`\`\`
EBITDA Margin = (EBITDA / Revenue) × 100%
\`\`\`

### Why EBITDA Matters for Agencies

1. **Valuation** - Agencies are often valued as a multiple of EBITDA (typically 4-10x for digital agencies)

2. **Operational Health** - Shows if your core operations are profitable, regardless of financing decisions

3. **Benchmarking** - Allows comparison with other agencies regardless of their capital structure

### Industry Benchmarks

| EBITDA Margin | Rating |
|---------------|--------|
| Below 10% | Needs improvement |
| 10-15% | Acceptable |
| 15-20% | Good |
| 20-25% | Excellent |
| 25%+ | Outstanding |

### What We Calculate

In this app, we calculate a simplified EBITDA:
- **Revenue** from your P&L documents or profile estimate
- **Operating Expenses** from P&L documents, or combined from overhead costs + employee costs

This gives you a clear picture of your agency's operating profitability.`

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
 * Type helper for the tools object returned by createEBITDATools
 */
export type EBITDATools = ReturnType<typeof createEBITDATools>
