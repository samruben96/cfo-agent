/**
 * Tests for CSV Auto-Mapping with Confidence Scoring
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #5, #6, #7: Auto-detect type and auto-map columns
 */

import { describe, it, expect } from 'vitest'
import {
  autoMapColumns,
  hasAllRequiredFields,
  getMappingConfidenceLabel,
  type AutoMappingResult
} from './csv-auto-mapper'

describe('autoMapColumns', () => {
  describe('P&L CSV mapping', () => {
    it('maps exact column names with high confidence', () => {
      const headers = ['description', 'expense_amount', 'date']
      const result = autoMapColumns(headers, 'pl')

      expect(result.mappings).toEqual({
        description: 'description',
        expense_amount: 'expense_amount',
        date: 'date'
      })
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      expect(result.shouldAutoApply).toBe(true)
    })

    it('maps synonym column names', () => {
      const headers = ['memo', 'cost', 'transaction_date']
      const result = autoMapColumns(headers, 'pl')

      expect(result.mappings.memo).toBe('description')
      expect(result.mappings.cost).toBe('expense_amount')
      expect(result.mappings.transaction_date).toBe('date')
    })

    it('identifies missing required fields', () => {
      const headers = ['category', 'notes']
      const result = autoMapColumns(headers, 'pl')

      expect(result.requiredFieldsMapped).toBeLessThan(result.totalRequiredFields)
      expect(result.shouldAutoApply).toBe(false)
    })

    it('ignores unmappable columns', () => {
      const headers = ['description', 'expense_amount', 'xyz_random_column']
      const result = autoMapColumns(headers, 'pl')

      expect(result.mappings.xyz_random_column).toBe('ignore')
    })
  })

  describe('Payroll CSV mapping', () => {
    it('maps exact payroll column names', () => {
      const headers = ['employee_name', 'gross_pay', 'net_pay', 'hours_worked']
      const result = autoMapColumns(headers, 'payroll')

      expect(result.mappings).toEqual({
        employee_name: 'employee_name',
        gross_pay: 'gross_pay',
        net_pay: 'net_pay',
        hours_worked: 'hours_worked'
      })
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('maps payroll synonyms', () => {
      const headers = ['worker', 'gross_earnings', 'take_home', 'total_hours']
      const result = autoMapColumns(headers, 'payroll')

      expect(result.mappings.worker).toBe('employee_name')
      expect(result.mappings.gross_earnings).toBe('gross_pay')
      expect(result.mappings.take_home).toBe('net_pay')
      expect(result.mappings.total_hours).toBe('hours_worked')
    })
  })

  describe('Employee CSV mapping', () => {
    it('maps exact employee column names', () => {
      const headers = ['name', 'role', 'department', 'annual_salary']
      const result = autoMapColumns(headers, 'employees')

      expect(result.mappings).toEqual({
        name: 'name',
        role: 'role',
        department: 'department',
        annual_salary: 'annual_salary'
      })
    })

    it('maps employee synonyms', () => {
      const headers = ['full_name', 'job_title', 'team', 'compensation']
      const result = autoMapColumns(headers, 'employees')

      expect(result.mappings.full_name).toBe('name')
      expect(result.mappings.job_title).toBe('role')
      expect(result.mappings.team).toBe('department')
      expect(result.mappings.compensation).toBe('annual_salary')
    })
  })

  describe('Confidence scoring', () => {
    it('returns high confidence for perfect matches', () => {
      const headers = ['description', 'expense_amount']
      const result = autoMapColumns(headers, 'pl')

      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('returns good confidence for synonym matches', () => {
      const headers = ['memo', 'cost']
      const result = autoMapColumns(headers, 'pl')

      // Synonym matches should still have good confidence
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('returns low confidence for partial matches', () => {
      const headers = ['desc', 'amt']
      const result = autoMapColumns(headers, 'pl')

      // Partial matches should have lower confidence
      expect(result.confidence).toBeLessThan(0.8)
    })

    it('returns base confidence for unknown type with no required fields', () => {
      const headers = ['random', 'columns']
      const result = autoMapColumns(headers, 'unknown')

      // Unknown type has no required fields, so confidence is based on mapping rate
      // Both columns will be 'ignore' with 0 confidence each
      expect(result.requiredFieldsMapped).toBe(0)
      expect(result.totalRequiredFields).toBe(0)
    })
  })

  describe('shouldAutoApply', () => {
    it('is true when confidence >= 80% and all required fields mapped', () => {
      const headers = ['description', 'expense_amount', 'date']
      const result = autoMapColumns(headers, 'pl')

      expect(result.shouldAutoApply).toBe(true)
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      expect(result.requiredFieldsMapped).toBe(result.totalRequiredFields)
    })

    it('is false when confidence < 80%', () => {
      const headers = ['desc', 'amt'] // Partial matches
      const result = autoMapColumns(headers, 'pl')

      expect(result.shouldAutoApply).toBe(false)
    })

    it('is false when required fields missing', () => {
      const headers = ['category', 'date'] // Missing description and expense_amount
      const result = autoMapColumns(headers, 'pl')

      expect(result.shouldAutoApply).toBe(false)
      expect(result.requiredFieldsMapped).toBeLessThan(result.totalRequiredFields)
    })
  })

  describe('Warnings', () => {
    it('adds warnings for low-confidence required field mappings', () => {
      // Headers that partially match required fields
      const headers = ['desc', 'amt']
      const result = autoMapColumns(headers, 'pl')

      // Should have warnings about low confidence matches
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('has no warnings for high-confidence matches', () => {
      const headers = ['description', 'expense_amount']
      const result = autoMapColumns(headers, 'pl')

      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('Edge cases', () => {
    it('handles empty headers array', () => {
      const result = autoMapColumns([], 'pl')

      expect(result.mappings).toEqual({})
      expect(result.confidence).toBe(0)
      expect(result.shouldAutoApply).toBe(false)
    })

    it('handles headers with special characters', () => {
      const headers = ['employee-name', 'gross pay', 'net_pay']
      const result = autoMapColumns(headers, 'payroll')

      expect(result.mappings['employee-name']).toBe('employee_name')
      expect(result.mappings['gross pay']).toBe('gross_pay')
    })

    it('does not double-map to same target', () => {
      const headers = ['name', 'employee_name', 'full_name'] // All map to 'name'
      const result = autoMapColumns(headers, 'employees')

      // Only first should map to 'name', others should be 'ignore'
      const nameMappings = Object.values(result.mappings).filter(v => v === 'name')
      expect(nameMappings.length).toBe(1)
    })

    it('handles case insensitivity', () => {
      const headers = ['DESCRIPTION', 'Expense_Amount', 'DATE']
      const result = autoMapColumns(headers, 'pl')

      expect(result.mappings.DESCRIPTION).toBe('description')
      expect(result.mappings.Expense_Amount).toBe('expense_amount')
      expect(result.mappings.DATE).toBe('date')
    })
  })
})

describe('hasAllRequiredFields', () => {
  it('returns true when all required fields are mapped', () => {
    const result: AutoMappingResult = {
      mappings: { a: 'description', b: 'expense_amount' },
      confidence: 0.9,
      requiredFieldsMapped: 2,
      totalRequiredFields: 2,
      shouldAutoApply: true,
      warnings: []
    }

    expect(hasAllRequiredFields(result)).toBe(true)
  })

  it('returns false when required fields are missing', () => {
    const result: AutoMappingResult = {
      mappings: { a: 'description' },
      confidence: 0.5,
      requiredFieldsMapped: 1,
      totalRequiredFields: 2,
      shouldAutoApply: false,
      warnings: []
    }

    expect(hasAllRequiredFields(result)).toBe(false)
  })
})

describe('getMappingConfidenceLabel', () => {
  it('returns High confidence for >= 0.9', () => {
    expect(getMappingConfidenceLabel(0.9)).toBe('High confidence')
    expect(getMappingConfidenceLabel(1.0)).toBe('High confidence')
  })

  it('returns Good confidence for >= 0.8', () => {
    expect(getMappingConfidenceLabel(0.8)).toBe('Good confidence')
    expect(getMappingConfidenceLabel(0.85)).toBe('Good confidence')
  })

  it('returns Moderate confidence for >= 0.6', () => {
    expect(getMappingConfidenceLabel(0.6)).toBe('Moderate confidence')
    expect(getMappingConfidenceLabel(0.7)).toBe('Moderate confidence')
  })

  it('returns Low confidence for >= 0.4', () => {
    expect(getMappingConfidenceLabel(0.4)).toBe('Low confidence')
    expect(getMappingConfidenceLabel(0.5)).toBe('Low confidence')
  })

  it('returns Very low confidence for < 0.4', () => {
    expect(getMappingConfidenceLabel(0.3)).toBe('Very low confidence')
    expect(getMappingConfidenceLabel(0)).toBe('Very low confidence')
  })
})
