/**
 * CSV Auto-Mapping with Confidence Scoring
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #5, #6, #7: Auto-detect type and auto-map columns
 */

import type { CSVType } from '@/types/documents'
import { getTargetFieldsForCSVType } from '@/types/documents'

/**
 * Result of auto-mapping with confidence score
 */
export interface AutoMappingResult {
  /** Column mappings: CSV header -> target field */
  mappings: Record<string, string>
  /** Overall confidence score (0-1) */
  confidence: number
  /** Number of required fields mapped */
  requiredFieldsMapped: number
  /** Total required fields for this type */
  totalRequiredFields: number
  /** Whether this should be auto-applied (confidence > 80%) */
  shouldAutoApply: boolean
  /** Specific warnings about uncertain mappings */
  warnings: string[]
}

/**
 * Required fields per CSV type
 */
export const REQUIRED_FIELDS: Record<CSVType, string[]> = {
  pl: ['description', 'expense_amount'],
  payroll: ['employee_name', 'gross_pay'],
  employees: ['name', 'role'],
  unknown: []
}

/**
 * Synonym mappings for common CSV column names.
 * Maps target field -> list of common column header names
 */
const COLUMN_SYNONYMS: Record<CSVType, Record<string, string[]>> = {
  pl: {
    revenue: ['revenue', 'income', 'sales', 'total_income', 'total_revenue'],
    expense_category: ['category', 'expense_category', 'account', 'account_name', 'type', 'expense_type', 'cost_center'],
    expense_amount: ['amount', 'expense_amount', 'value', 'total', 'cost', 'expense', 'debit', 'credit'],
    date: ['date', 'transaction_date', 'period', 'month', 'year', 'posting_date'],
    description: ['description', 'memo', 'notes', 'details', 'line_item', 'item', 'name'],
    transaction_type: ['type', 'transaction_type', 'entry_type', 'income_expense', 'dr_cr']
  },
  payroll: {
    employee_name: ['name', 'employee_name', 'employee', 'full_name', 'staff_name', 'worker'],
    employee_id: ['id', 'employee_id', 'emp_id', 'staff_id', 'employee_number', 'emp_no'],
    hours_worked: ['hours', 'hours_worked', 'total_hours', 'work_hours', 'regular_hours'],
    hourly_rate: ['rate', 'hourly_rate', 'pay_rate', 'hour_rate'],
    gross_pay: ['gross', 'gross_pay', 'gross_wages', 'gross_earnings', 'total_pay', 'total_earnings'],
    net_pay: ['net', 'net_pay', 'net_wages', 'take_home', 'net_earnings'],
    pay_date: ['date', 'pay_date', 'payment_date', 'check_date', 'period_end']
  },
  employees: {
    name: ['name', 'full_name', 'employee_name', 'employee', 'staff_name', 'first_last'],
    employee_id: ['id', 'employee_id', 'emp_id', 'staff_id', 'employee_number'],
    role: ['role', 'title', 'job_title', 'position', 'job', 'designation'],
    department: ['department', 'dept', 'team', 'division', 'group', 'unit'],
    annual_salary: ['salary', 'annual_salary', 'yearly_salary', 'base_salary', 'compensation'],
    annual_benefits: ['benefits', 'annual_benefits', 'total_benefits', 'benefit_cost'],
    employment_type: ['type', 'employment_type', 'emp_type', 'status', 'full_part_time', 'ft_pt']
  },
  unknown: {}
}

/**
 * Confidence weights for different match types
 */
const MATCH_WEIGHTS = {
  exact: 1.0,      // Exact match (e.g., "employee_name" -> "employee_name")
  synonym: 0.85,   // Synonym match (e.g., "worker" -> "employee_name")
  partial: 0.7,    // Partial match (e.g., "emp_name" -> "employee_name")
  fuzzy: 0.5,      // Fuzzy match (e.g., "empoyee" -> "employee_name")
  none: 0          // No match
}

/**
 * Get the match confidence for a single column
 */
function getColumnMatchConfidence(
  header: string,
  targetField: string,
  synonyms: string[]
): number {
  const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, '_')
  const normalizedTarget = targetField.toLowerCase().replace(/[_\s-]+/g, '_')

  // Exact match with target field
  if (normalizedHeader === normalizedTarget) {
    return MATCH_WEIGHTS.exact
  }

  // Exact match with synonym
  for (const synonym of synonyms) {
    const normalizedSynonym = synonym.toLowerCase().replace(/[_\s-]+/g, '_')
    if (normalizedHeader === normalizedSynonym) {
      return MATCH_WEIGHTS.exact
    }
  }

  // Partial match (header contains synonym or vice versa)
  for (const synonym of synonyms) {
    const normalizedSynonym = synonym.toLowerCase().replace(/[_\s-]+/g, '_')
    if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
      return MATCH_WEIGHTS.partial
    }
  }

  // No match
  return MATCH_WEIGHTS.none
}

/**
 * Auto-detect mappings with confidence scoring
 */
export function autoMapColumns(
  headers: string[],
  csvType: CSVType
): AutoMappingResult {
  const mappings: Record<string, string> = {}
  const columnConfidences: number[] = []
  const warnings: string[] = []

  const targetFields = getTargetFieldsForCSVType(csvType)
  const synonyms = COLUMN_SYNONYMS[csvType] || {}
  const requiredFields = REQUIRED_FIELDS[csvType] || []
  const usedTargets = new Set<string>()

  // Score each header against each target field
  for (const header of headers) {
    let bestMatch = { field: 'ignore', confidence: 0 }

    for (const targetField of targetFields) {
      if (usedTargets.has(targetField)) continue // Don't double-map

      const fieldSynonyms = synonyms[targetField] || []
      const confidence = getColumnMatchConfidence(header, targetField, fieldSynonyms)

      if (confidence > bestMatch.confidence) {
        bestMatch = { field: targetField, confidence }
      }
    }

    // Only map if we have some confidence
    if (bestMatch.confidence > 0) {
      mappings[header] = bestMatch.field
      usedTargets.add(bestMatch.field)
      columnConfidences.push(bestMatch.confidence)

      // Add warning for low-confidence matches on important fields
      if (bestMatch.confidence < MATCH_WEIGHTS.synonym && requiredFields.includes(bestMatch.field)) {
        warnings.push(`"${header}" → ${bestMatch.field} (low confidence)`)
      }
    } else {
      mappings[header] = 'ignore'
      // Don't penalize ignored columns
    }
  }

  // Calculate overall confidence
  // Weighted by: required fields matter more
  let requiredFieldsMapped = 0
  let requiredFieldsConfidence = 0

  for (const [header, target] of Object.entries(mappings)) {
    if (requiredFields.includes(target)) {
      requiredFieldsMapped++
      const idx = headers.indexOf(header)
      if (idx >= 0 && idx < columnConfidences.length) {
        requiredFieldsConfidence += columnConfidences[idx]
      }
    }
  }

  // Calculate confidence:
  // - 70% weight on required fields being mapped with confidence
  // - 30% weight on overall column confidence
  const requiredWeight = requiredFields.length > 0
    ? (requiredFieldsMapped / requiredFields.length) * (requiredFieldsConfidence / Math.max(requiredFieldsMapped, 1))
    : 1

  const overallColumnConfidence = columnConfidences.length > 0
    ? columnConfidences.reduce((sum, c) => sum + c, 0) / columnConfidences.length
    : 0

  const confidence = Math.round(((requiredWeight * 0.7) + (overallColumnConfidence * 0.3)) * 100) / 100

  return {
    mappings,
    confidence,
    requiredFieldsMapped,
    totalRequiredFields: requiredFields.length,
    shouldAutoApply: confidence >= 0.8 && requiredFieldsMapped === requiredFields.length,
    warnings
  }
}

/**
 * Check if a mapping result has all required fields
 */
export function hasAllRequiredFields(result: AutoMappingResult): boolean {
  return result.requiredFieldsMapped >= result.totalRequiredFields
}

/**
 * Get human-readable description of mapping confidence
 */
export function getMappingConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High confidence'
  if (confidence >= 0.8) return 'Good confidence'
  if (confidence >= 0.6) return 'Moderate confidence'
  if (confidence >= 0.4) return 'Low confidence'
  return 'Very low confidence'
}
