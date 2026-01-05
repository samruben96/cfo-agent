/**
 * Smart Summary Generator for Documents
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #8: Generate smart summaries with key metrics
 */

import type { Document, CSVType } from '@/types/documents'

/**
 * Configuration constants for smart summary generation
 */
export const SMART_SUMMARY_CONFIG = {
  /** Base confidence for recognized document types */
  BASE_CONFIDENCE: {
    PDF: 0.8,
    CSV: 0.7,
    GENERIC: 0.5,
  },
  /** Confidence boost for each valid metric found */
  CONFIDENCE_BOOST_PER_METRIC: 0.05,
  /** Maximum confidence value (capped at 1.0) */
  MAX_CONFIDENCE: 1.0,
  /** Maximum metrics to display in summary */
  MAX_DISPLAY_METRICS: 3,
  /** Minimum numeric threshold to treat as currency */
  CURRENCY_THRESHOLD: 100,
  /** Sample size for detecting numeric columns in CSVs */
  NUMERIC_COLUMN_SAMPLE_SIZE: 100,
  /** Minimum percentage of numeric values to consider column as numeric */
  NUMERIC_COLUMN_THRESHOLD: 0.5,
} as const

import { getPDFSchemaType } from '@/types/documents'
import type { PLExtraction, PayrollExtraction, ExpenseExtraction } from '@/lib/documents/extraction-schemas'

/**
 * Key metric extracted from document data
 */
export interface KeyMetric {
  label: string
  value: string
  type: 'currency' | 'number' | 'percentage' | 'text' | 'date'
}

/**
 * Smart summary containing key insights from a document
 */
export interface SmartSummary {
  title: string
  documentType: 'pl' | 'payroll' | 'expense' | 'employees' | 'csv' | 'pdf' | 'unknown'
  metrics: KeyMetric[]
  itemCount?: number
  dateRange?: {
    start: string
    end: string
  }
  confidence: number // 0-1 scale
}

/**
 * Format a number as currency (USD)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format a number with commas
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// formatPercentage can be added back when needed for percentage metrics

/**
 * Format a period date string (YYYY-MM-DD) to readable format (e.g., "Jan 2024")
 */
function formatPeriodDate(dateStr: string): string {
  if (!dateStr || dateStr === '') return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Safely parse a numeric value from various formats
 */
function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Extract date range from an array of items with date fields
 */
function extractDateRange(items: Record<string, unknown>[]): { start: string; end: string } | undefined {
  const dateFields = ['date', 'pay_date', 'payDate', 'transaction_date', 'transactionDate', 'period']
  const dates: Date[] = []

  for (const item of items) {
    for (const field of dateFields) {
      const value = item[field]
      if (typeof value === 'string') {
        const parsed = new Date(value)
        if (!isNaN(parsed.getTime())) {
          dates.push(parsed)
        }
      }
    }
  }

  if (dates.length === 0) return undefined

  dates.sort((a, b) => a.getTime() - b.getTime())
  const start = dates[0]
  const end = dates[dates.length - 1]

  // Format as "Jan 2024" or "Jan-Mar 2024" for same year
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return {
    start: formatDate(start),
    end: formatDate(end)
  }
}

/**
 * Generate smart summary for P&L documents
 */
function summarizePL(data: PLExtraction): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.PDF

  // Total revenue (from nested revenue.total per schema)
  if (data.revenue?.total !== undefined) {
    const revenue = parseNumericValue(data.revenue.total)
    if (revenue !== null && revenue !== 0) {
      metrics.push({ label: 'Revenue', value: formatCurrency(revenue), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }
  }

  // Total expenses (from nested expenses.total per schema)
  if (data.expenses?.total !== undefined) {
    const expenses = parseNumericValue(data.expenses.total)
    if (expenses !== null && expenses !== 0) {
      metrics.push({ label: 'Expenses', value: formatCurrency(expenses), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }
  }

  // Net income (use provided value if non-zero, otherwise calculate)
  const providedNetIncome = data.netIncome !== undefined ? parseNumericValue(data.netIncome) : null
  if (providedNetIncome !== null && providedNetIncome !== 0) {
    metrics.push({ label: 'Net Income', value: formatCurrency(providedNetIncome), type: 'currency' })
    confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
  } else if (metrics.length >= 2) {
    // Calculate net income if we have both revenue and expenses
    const revenue = data.revenue?.total ? parseNumericValue(data.revenue.total) : null
    const expenses = data.expenses?.total ? parseNumericValue(data.expenses.total) : null
    if (revenue !== null && expenses !== null) {
      const netIncome = revenue - expenses
      if (netIncome !== 0) {
        metrics.push({ label: 'Net Income', value: formatCurrency(netIncome), type: 'currency' })
      }
    }
  }

  // Line items count (combine revenue line items and expense categories)
  const revenueLineItemCount = Array.isArray(data.revenue?.lineItems) ? data.revenue.lineItems.length : 0
  const expenseCategoryCount = Array.isArray(data.expenses?.categories) ? data.expenses.categories.length : 0
  const itemCount = revenueLineItemCount + expenseCategoryCount > 0 ? revenueLineItemCount + expenseCategoryCount : undefined

  // Date range from period (P&L uses period, not line item dates)
  const dateRange = data.period?.startDate && data.period?.endDate
    ? { start: formatPeriodDate(data.period.startDate), end: formatPeriodDate(data.period.endDate) }
    : undefined

  return {
    documentType: 'pl',
    metrics,
    itemCount,
    dateRange,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate smart summary for Payroll documents
 */
function summarizePayroll(data: PayrollExtraction): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.PDF

  // Employee count
  if (Array.isArray(data.employees)) {
    metrics.push({ label: 'Employees', value: formatNumber(data.employees.length), type: 'number' })
    confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC

    // Calculate total payroll
    let totalGross = 0
    let totalNet = 0
    for (const emp of data.employees) {
      const gross = parseNumericValue(emp.grossPay)
      const net = parseNumericValue(emp.netPay)
      if (gross !== null) totalGross += gross
      if (net !== null) totalNet += net
    }

    if (totalGross > 0) {
      metrics.push({ label: 'Total Gross', value: formatCurrency(totalGross), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }

    if (totalNet > 0) {
      metrics.push({ label: 'Total Net', value: formatCurrency(totalNet), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }
  }

  // Pay period (payPeriod is an object with startDate/endDate per schema)
  if (data.payPeriod?.startDate && data.payPeriod?.endDate) {
    const start = formatPeriodDate(data.payPeriod.startDate)
    const end = formatPeriodDate(data.payPeriod.endDate)
    if (start && end) {
      metrics.push({ label: 'Period', value: `${start} - ${end}`, type: 'text' })
      confidence += 0.02 // Smaller boost for metadata
    }
  }

  const itemCount = Array.isArray(data.employees) ? data.employees.length : undefined

  // Date range from pay period (employees don't have date fields)
  const dateRange = data.payPeriod?.startDate && data.payPeriod?.endDate
    ? { start: formatPeriodDate(data.payPeriod.startDate), end: formatPeriodDate(data.payPeriod.endDate) }
    : undefined

  return {
    documentType: 'payroll',
    metrics,
    itemCount,
    dateRange,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate smart summary for Expense documents
 */
function summarizeExpense(data: ExpenseExtraction): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.PDF

  // Total expenses (nested in summary per schema, fallback to line items calculation)
  const summaryTotal = data.summary?.totalExpenses !== undefined
    ? parseNumericValue(data.summary.totalExpenses)
    : null

  if (summaryTotal !== null && summaryTotal > 0) {
    metrics.push({ label: 'Total', value: formatCurrency(summaryTotal), type: 'currency' })
    confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC * 2 // Higher boost for summary total
  } else if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
    // Calculate from line items if summary total not available or is zero
    let total = 0
    for (const exp of data.lineItems) {
      const amount = parseNumericValue(exp.amount)
      if (amount !== null) total += amount
    }
    if (total > 0) {
      metrics.push({ label: 'Total', value: formatCurrency(total), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }
  }

  // Category breakdown (from summary.categories or lineItems)
  if (Array.isArray(data.summary?.categories) && data.summary.categories.length > 0) {
    // Use pre-computed category summaries
    const sorted = [...data.summary.categories].sort((a, b) => b.currentPeriod - a.currentPeriod)
    if (sorted.length > 0) {
      metrics.push({ label: `Top: ${sorted[0].category}`, value: formatCurrency(sorted[0].currentPeriod), type: 'currency' })
    }
  } else if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
    // Calculate from line items
    const byCategory: Record<string, number> = {}
    for (const exp of data.lineItems) {
      const category = String(exp.category || 'Other')
      const amount = parseNumericValue(exp.amount)
      if (amount !== null) {
        byCategory[category] = (byCategory[category] || 0) + amount
      }
    }

    // Get top category
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      metrics.push({ label: `Top: ${sorted[0][0]}`, value: formatCurrency(sorted[0][1]), type: 'currency' })
    }
  }

  const itemCount = Array.isArray(data.lineItems) ? data.lineItems.length : undefined

  // Date range from lineItems (which have date fields) or period
  let dateRange: { start: string; end: string } | undefined
  if (data.period?.startDate && data.period?.endDate) {
    dateRange = { start: formatPeriodDate(data.period.startDate), end: formatPeriodDate(data.period.endDate) }
  } else if (Array.isArray(data.lineItems)) {
    dateRange = extractDateRange(data.lineItems as unknown as Record<string, unknown>[])
  }

  return {
    documentType: 'expense',
    metrics,
    itemCount,
    dateRange,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate smart summary for Employee CSV data
 */
function summarizeEmployees(headers: string[], rows: Record<string, unknown>[]): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.CSV

  // Employee count
  metrics.push({ label: 'Employees', value: formatNumber(rows.length), type: 'number' })
  confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC * 2

  // Find salary field
  const salaryFields = ['annual_salary', 'salary', 'annualSalary', 'pay', 'compensation']
  const salaryField = headers.find(h => salaryFields.some(sf => h.toLowerCase().includes(sf.toLowerCase())))

  if (salaryField) {
    let totalSalary = 0
    for (const row of rows) {
      const salary = parseNumericValue(row[salaryField])
      if (salary !== null) totalSalary += salary
    }
    if (totalSalary > 0) {
      metrics.push({ label: 'Total Salaries', value: formatCurrency(totalSalary), type: 'currency' })
      const avgSalary = totalSalary / rows.length
      metrics.push({ label: 'Avg Salary', value: formatCurrency(avgSalary), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC * 2
    }
  }

  // Count by role/department if available
  const roleFields = ['role', 'title', 'position', 'job_title']
  const roleField = headers.find(h => roleFields.some(rf => h.toLowerCase().includes(rf.toLowerCase())))

  if (roleField) {
    const roles = new Set(rows.map(r => String(r[roleField] || '')).filter(Boolean))
    metrics.push({ label: 'Roles', value: formatNumber(roles.size), type: 'number' })
  }

  return {
    documentType: 'employees',
    metrics,
    itemCount: rows.length,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate smart summary for generic CSV data
 */
function summarizeGenericCSV(headers: string[], rows: Record<string, unknown>[], csvType: CSVType): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.GENERIC

  // Row count
  metrics.push({ label: 'Rows', value: formatNumber(rows.length), type: 'number' })

  // Column count
  metrics.push({ label: 'Columns', value: formatNumber(headers.length), type: 'number' })

  // Try to find numeric columns and sum them
  const numericColumns: { field: string; total: number }[] = []
  for (const header of headers) {
    let total = 0
    let count = 0
    const sampleRows = rows.slice(0, SMART_SUMMARY_CONFIG.NUMERIC_COLUMN_SAMPLE_SIZE)
    for (const row of sampleRows) {
      const val = parseNumericValue(row[header])
      if (val !== null) {
        total += val
        count++
      }
    }
    if (count > rows.length * SMART_SUMMARY_CONFIG.NUMERIC_COLUMN_THRESHOLD) {
      numericColumns.push({ field: header, total })
    }
  }

  // Add largest numeric column as a metric
  if (numericColumns.length > 0) {
    numericColumns.sort((a, b) => b.total - a.total)
    const top = numericColumns[0]
    // Check if it looks like currency (large numbers)
    if (top.total > SMART_SUMMARY_CONFIG.CURRENCY_THRESHOLD) {
      metrics.push({ label: `Total ${top.field}`, value: formatCurrency(top.total), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC * 2
    }
  }

  return {
    documentType: csvType === 'pl' ? 'pl' : csvType === 'payroll' ? 'payroll' : 'csv',
    metrics,
    itemCount: rows.length,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate smart summary for PDF with generic/unknown extraction
 */
function summarizeGenericPDF(data: Record<string, unknown>): Partial<SmartSummary> {
  const metrics: KeyMetric[] = []
  let confidence = SMART_SUMMARY_CONFIG.BASE_CONFIDENCE.GENERIC

  // Look for common financial fields
  const currencyFields = ['total', 'amount', 'revenue', 'expense', 'income', 'cost', 'price', 'balance']
  const dateFields = ['date', 'period', 'month', 'year']

  for (const [key, value] of Object.entries(data)) {
    if (key === 'documentType' || key === 'lineItems') continue

    const lowerKey = key.toLowerCase()
    const numValue = parseNumericValue(value)

    // Currency fields
    if (currencyFields.some(cf => lowerKey.includes(cf)) && numValue !== null) {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      metrics.push({ label, value: formatCurrency(numValue), type: 'currency' })
      confidence += SMART_SUMMARY_CONFIG.CONFIDENCE_BOOST_PER_METRIC
    }
    // Date fields
    else if (dateFields.some(df => lowerKey.includes(df)) && typeof value === 'string') {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      metrics.push({ label, value: String(value), type: 'date' })
      confidence += 0.02 // Smaller boost for metadata
    }
    // Plain numbers
    else if (numValue !== null && Math.abs(numValue) > SMART_SUMMARY_CONFIG.CURRENCY_THRESHOLD) {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      metrics.push({ label, value: formatCurrency(numValue), type: 'currency' })
      confidence += 0.02
    }
  }

  // Line items count
  const lineItems = data.lineItems || data.line_items
  const itemCount = Array.isArray(lineItems) ? lineItems.length : undefined
  const dateRange = Array.isArray(lineItems) ? extractDateRange(lineItems as Record<string, unknown>[]) : undefined

  // Limit to top most relevant metrics
  metrics.splice(SMART_SUMMARY_CONFIG.MAX_DISPLAY_METRICS)

  return {
    documentType: 'pdf',
    metrics,
    itemCount,
    dateRange,
    confidence: Math.min(confidence, SMART_SUMMARY_CONFIG.MAX_CONFIDENCE)
  }
}

/**
 * Generate a title for the document based on type and filename
 */
function generateTitle(document: Document, documentType: SmartSummary['documentType']): string {
  // Try to use filename without extension
  const baseName = document.filename.replace(/\.[^.]+$/, '')

  // Clean up common patterns
  const cleaned = baseName
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // If it's too generic or just a date, use document type
  if (cleaned.length < 3 || /^\d{4}[-\s]\d{2}([-\s]\d{2})?$/.test(cleaned)) {
    switch (documentType) {
      case 'pl': return 'P&L Statement'
      case 'payroll': return 'Payroll Report'
      case 'expense': return 'Expense Report'
      case 'employees': return 'Employee Data'
      default: return cleaned || 'Document'
    }
  }

  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Generate a smart summary for any document.
 * Analyzes extracted data and produces key metrics appropriate to the document type.
 */
export function generateSmartSummary(document: Document): SmartSummary {
  const extractedData = document.extractedData || {}

  // Determine document type and generate appropriate summary
  let summary: Partial<SmartSummary>

  if (document.fileType === 'pdf') {
    const schemaType = getPDFSchemaType(extractedData)

    switch (schemaType) {
      case 'pl':
        summary = summarizePL(extractedData as PLExtraction)
        break
      case 'payroll':
        summary = summarizePayroll(extractedData as PayrollExtraction)
        break
      case 'expense':
        summary = summarizeExpense(extractedData as ExpenseExtraction)
        break
      default:
        summary = summarizeGenericPDF(extractedData)
    }
  } else {
    // CSV document
    const headers = (extractedData.headers as string[]) || []
    const rows = (extractedData.preview as Record<string, unknown>[]) || []

    switch (document.csvType) {
      case 'employees':
        summary = summarizeEmployees(headers, rows)
        break
      case 'pl':
      case 'payroll':
        summary = summarizeGenericCSV(headers, rows, document.csvType)
        break
      default:
        summary = summarizeGenericCSV(headers, rows, 'unknown')
    }

    // Add row count from document if available
    if (document.rowCount) {
      summary.itemCount = document.rowCount
    }
  }

  // Generate title
  const documentType = summary.documentType || 'unknown'
  const title = generateTitle(document, documentType)

  return {
    title,
    documentType,
    metrics: summary.metrics || [],
    itemCount: summary.itemCount,
    dateRange: summary.dateRange,
    confidence: summary.confidence || 0.5
  }
}

/**
 * Generate suggested follow-up questions based on document type and content
 */
export function generateSuggestedQuestions(summary: SmartSummary): string[] {
  const questions: string[] = []

  switch (summary.documentType) {
    case 'pl':
      questions.push('What are my biggest expense categories?')
      questions.push('How does this compare to last month?')
      questions.push('What\'s my profit margin?')
      break
    case 'payroll':
      questions.push('What\'s my average employee cost?')
      questions.push('Show me payroll by department')
      questions.push('How has payroll changed over time?')
      break
    case 'expense':
      questions.push('Where am I spending the most?')
      questions.push('Are there any unusual expenses?')
      questions.push('How can I reduce costs?')
      break
    case 'employees':
      questions.push('What\'s my total payroll cost?')
      questions.push('Show me headcount by department')
      questions.push('What are my labor costs?')
      break
    default:
      questions.push('What insights can you find in this data?')
      questions.push('Summarize the key points')
      questions.push('Are there any patterns I should know about?')
  }

  // Return top 3 questions
  return questions.slice(0, 3)
}
