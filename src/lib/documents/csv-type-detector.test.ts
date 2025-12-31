/**
 * Tests for CSV type detection utilities.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect } from 'vitest'

import { detectCSVType, getCSVTypeLabel, getRequiredColumnsForType } from './csv-type-detector'

describe('detectCSVType', () => {
  describe('P&L detection', () => {
    it('detects P&L format with revenue and expense columns', () => {
      const headers = ['Date', 'Description', 'Revenue', 'Expenses', 'Net Income']

      const result = detectCSVType(headers)

      expect(result.type).toBe('pl')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.matchedColumns).toContain('revenue')
    })

    it('detects P&L with income/cost terminology', () => {
      const headers = ['Period', 'Income', 'Cost', 'Total', 'Gross Margin']

      const result = detectCSVType(headers)

      expect(result.type).toBe('pl')
    })

    it('detects P&L with EBITDA column', () => {
      const headers = ['Date', 'Sales', 'EBITDA', 'Operating Income']

      const result = detectCSVType(headers)

      expect(result.type).toBe('pl')
    })
  })

  describe('Payroll detection', () => {
    it('detects Payroll format with hours and pay columns', () => {
      const headers = ['Employee Name', 'Hours Worked', 'Hourly Rate', 'Gross Pay', 'Net Pay']

      const result = detectCSVType(headers)

      expect(result.type).toBe('payroll')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('detects Payroll with deductions', () => {
      const headers = ['Staff', 'Hours', 'Rate', 'Deductions', 'Tax', 'Net']

      const result = detectCSVType(headers)

      expect(result.type).toBe('payroll')
    })

    it('detects Payroll with pay period column', () => {
      const headers = ['Employee', 'Pay Period', 'Gross Pay', 'Withholding', 'Net Pay']

      const result = detectCSVType(headers)

      expect(result.type).toBe('payroll')
    })
  })

  describe('Employee roster detection', () => {
    it('detects Employee format with name and role columns', () => {
      const headers = ['Employee Name', 'Role', 'Department', 'Annual Salary', 'Benefits']

      const result = detectCSVType(headers)

      expect(result.type).toBe('employees')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('detects Employee format with title and hire date', () => {
      const headers = ['Name', 'Job Title', 'Start Date', 'Salary', 'Email']

      const result = detectCSVType(headers)

      expect(result.type).toBe('employees')
    })

    it('detects Employee format with employment type', () => {
      const headers = ['Staff Name', 'Position', 'Employment Type', 'Annual Benefits', 'Department']

      const result = detectCSVType(headers)

      expect(result.type).toBe('employees')
    })
  })

  describe('Unknown format', () => {
    it('returns unknown for empty headers', () => {
      const result = detectCSVType([])

      expect(result.type).toBe('unknown')
      expect(result.confidence).toBe(0)
      expect(result.matchedColumns).toHaveLength(0)
    })

    it('returns unknown for unrecognized headers', () => {
      const headers = ['ID', 'Code', 'Timestamp', 'Value', 'Flag']

      const result = detectCSVType(headers)

      expect(result.type).toBe('unknown')
    })

    it('returns unknown when insufficient matches', () => {
      const headers = ['Name', 'ID'] // Only 1 match

      const result = detectCSVType(headers)

      expect(result.type).toBe('unknown')
    })

    it('returns unknown when types are ambiguous (close scores)', () => {
      // Headers that could match multiple types equally
      const headers = ['Name', 'Total'] // Generic headers

      const result = detectCSVType(headers)

      // Should be unknown since no clear winner
      expect(result.type).toBe('unknown')
    })
  })

  describe('confidence scoring', () => {
    it('gives higher confidence for more matching columns', () => {
      const fewHeaders = ['Revenue', 'Expense']
      const manyHeaders = [
        'Date',
        'Revenue',
        'Expense',
        'Net Income',
        'Gross Margin',
        'Operating Income',
        'EBITDA'
      ]

      const fewResult = detectCSVType(fewHeaders)
      const manyResult = detectCSVType(manyHeaders)

      // Both should detect P&L
      expect(fewResult.type).toBe('pl')
      expect(manyResult.type).toBe('pl')

      // Many headers should have higher confidence
      expect(manyResult.confidence).toBeGreaterThanOrEqual(fewResult.confidence)
    })

    it('confidence is between 0 and 1', () => {
      const headers = [
        'Revenue',
        'Expense',
        'Net Income',
        'Sales',
        'Cost',
        'Gross',
        'Operating',
        'Overhead',
        'Total',
        'Margin'
      ]

      const result = detectCSVType(headers)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('case insensitivity', () => {
    it('handles uppercase headers', () => {
      const headers = ['EMPLOYEE NAME', 'ANNUAL SALARY', 'DEPARTMENT', 'ROLE']

      const result = detectCSVType(headers)

      expect(result.type).toBe('employees')
    })

    it('handles mixed case headers', () => {
      const headers = ['Gross PAY', 'Net Pay', 'Hours Worked', 'DEDUCTIONS']

      const result = detectCSVType(headers)

      expect(result.type).toBe('payroll')
    })
  })
})

describe('getCSVTypeLabel', () => {
  it('returns correct label for pl type', () => {
    expect(getCSVTypeLabel('pl')).toBe('Profit & Loss Statement')
  })

  it('returns correct label for payroll type', () => {
    expect(getCSVTypeLabel('payroll')).toBe('Payroll Report')
  })

  it('returns correct label for employees type', () => {
    expect(getCSVTypeLabel('employees')).toBe('Employee Roster')
  })

  it('returns Unknown Format for unknown type', () => {
    expect(getCSVTypeLabel('unknown')).toBe('Unknown Format')
  })
})

describe('getRequiredColumnsForType', () => {
  it('returns required columns for pl type', () => {
    const required = getRequiredColumnsForType('pl')
    expect(required).toContain('description')
    expect(required).toContain('amount')
  })

  it('returns required columns for payroll type', () => {
    const required = getRequiredColumnsForType('payroll')
    expect(required).toContain('employee')
    expect(required).toContain('amount')
  })

  it('returns required columns for employees type', () => {
    const required = getRequiredColumnsForType('employees')
    expect(required).toContain('name')
    expect(required).toContain('role')
  })

  it('returns empty array for unknown type', () => {
    expect(getRequiredColumnsForType('unknown')).toEqual([])
  })
})
