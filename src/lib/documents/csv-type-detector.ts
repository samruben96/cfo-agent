/**
 * CSV type detection utilities.
 * Analyzes column headers to determine the type of financial data.
 * Story: 3.3 CSV File Upload
 */
import type { CSVType } from '@/types/documents'

export interface DetectionResult {
  type: CSVType
  confidence: number
  matchedColumns: string[]
}

// Column patterns for P&L (Profit & Loss) documents
const PL_PATTERNS: RegExp[] = [
  /revenue/i,
  /income/i,
  /sales/i,
  /expense/i,
  /cost/i,
  /spending/i,
  /net\s?(income|profit)/i,
  /total/i,
  /gross/i,
  /margin/i,
  /operating/i,
  /overhead/i
]

// Column patterns for Payroll documents
const PAYROLL_PATTERNS: RegExp[] = [
  /employee/i,
  /name/i,
  /staff/i,
  /hours/i,
  /rate/i,
  /wage/i,
  /gross/i,
  /net/i,
  /pay/i,
  /deduction/i,
  /tax/i,
  /period/i,
  /check/i,
  /deposit/i
]

// Column patterns for Employee roster documents
const EMPLOYEE_PATTERNS: RegExp[] = [
  /employee/i,
  /name/i,
  /staff/i,
  /role/i,
  /title/i,
  /position/i,
  /department/i,
  /team/i,
  /salary/i,
  /compensation/i,
  /benefits/i,
  /hire/i,
  /start/i,
  /email/i,
  /phone/i
]

// Patterns that uniquely identify P&L (not found in other types)
const PL_UNIQUE_PATTERNS: RegExp[] = [
  /revenue/i,
  /expense/i,
  /net\s?(income|profit)/i,
  /ebitda/i,
  /gross\s?margin/i,
  /operating\s?(income|expense)/i
]

// Patterns that uniquely identify Payroll
const PAYROLL_UNIQUE_PATTERNS: RegExp[] = [
  /hours\s?(worked)?/i,
  /hourly\s?rate/i,
  /gross\s?pay/i,
  /net\s?pay/i,
  /deduction/i,
  /withholding/i,
  /overtime/i,
  /pay\s?(period|date)/i
]

// Patterns that uniquely identify Employee roster
const EMPLOYEE_UNIQUE_PATTERNS: RegExp[] = [
  /annual\s?salary/i,
  /annual\s?benefits/i,
  /employment\s?type/i,
  /hire\s?date/i,
  /department/i,
  /job\s?title/i,
  /start\s?date/i
]

interface MatchResult {
  count: number
  matched: string[]
  uniqueMatches: number
}

/**
 * Count how many headers match the given patterns.
 */
function countMatches(
  headers: string[],
  patterns: RegExp[],
  uniquePatterns: RegExp[] = []
): MatchResult {
  const matched: string[] = []
  const matchedPatterns = new Set<string>()
  let uniqueMatches = 0

  for (const header of headers) {
    // Check against general patterns
    for (const pattern of patterns) {
      if (pattern.test(header) && !matchedPatterns.has(pattern.source)) {
        matched.push(header)
        matchedPatterns.add(pattern.source)
        break
      }
    }

    // Check against unique patterns
    for (const pattern of uniquePatterns) {
      if (pattern.test(header)) {
        uniqueMatches++
        break
      }
    }
  }

  return { count: matched.length, matched, uniqueMatches }
}

/**
 * Detect the type of CSV data based on column headers.
 * Returns the detected type with confidence score and matched columns.
 */
export function detectCSVType(headers: string[]): DetectionResult {
  if (!headers || headers.length === 0) {
    return { type: 'unknown', confidence: 0, matchedColumns: [] }
  }

  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

  const plScore = countMatches(normalizedHeaders, PL_PATTERNS, PL_UNIQUE_PATTERNS)
  const payrollScore = countMatches(normalizedHeaders, PAYROLL_PATTERNS, PAYROLL_UNIQUE_PATTERNS)
  const employeeScore = countMatches(normalizedHeaders, EMPLOYEE_PATTERNS, EMPLOYEE_UNIQUE_PATTERNS)

  // Prioritize unique pattern matches as they're more specific
  const scores = [
    {
      type: 'pl' as const,
      score: plScore.count + plScore.uniqueMatches * 2,
      matched: plScore.matched,
      patternCount: PL_PATTERNS.length + PL_UNIQUE_PATTERNS.length
    },
    {
      type: 'payroll' as const,
      score: payrollScore.count + payrollScore.uniqueMatches * 2,
      matched: payrollScore.matched,
      patternCount: PAYROLL_PATTERNS.length + PAYROLL_UNIQUE_PATTERNS.length
    },
    {
      type: 'employees' as const,
      score: employeeScore.count + employeeScore.uniqueMatches * 2,
      matched: employeeScore.matched,
      patternCount: EMPLOYEE_PATTERNS.length + EMPLOYEE_UNIQUE_PATTERNS.length
    }
  ]

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  const best = scores[0]
  const secondBest = scores[1]

  // Require minimum 2 matches and clear winner (>= 2 points ahead)
  if (best.score < 2 || (secondBest && best.score - secondBest.score < 2)) {
    return { type: 'unknown', confidence: 0, matchedColumns: [] }
  }

  // Calculate confidence as ratio of matches to total headers, capped at 1.0
  const confidence = Math.min(best.score / (headers.length + 2), 1.0)

  return {
    type: best.type,
    confidence: Math.round(confidence * 100) / 100,
    matchedColumns: best.matched
  }
}

/**
 * Get human-readable label for CSV type.
 */
export function getCSVTypeLabel(type: CSVType): string {
  switch (type) {
    case 'pl':
      return 'Profit & Loss Statement'
    case 'payroll':
      return 'Payroll Report'
    case 'employees':
      return 'Employee Roster'
    default:
      return 'Unknown Format'
  }
}

/**
 * Get required columns for a given CSV type.
 * Used for validation during import.
 */
export function getRequiredColumnsForType(type: CSVType): string[] {
  switch (type) {
    case 'pl':
      return ['description', 'amount'] // or 'revenue'/'expense'
    case 'payroll':
      return ['employee', 'amount'] // or 'gross_pay'/'net_pay'
    case 'employees':
      return ['name', 'role']
    default:
      return []
  }
}
