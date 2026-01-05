/**
 * Tests for Smart Summary Generator
 * Story: 5.0 - Chat-First Document Upload with Unified Experience
 * AC #8: Generate smart summaries with key metrics
 */

import { describe, it, expect } from 'vitest'
import { generateSmartSummary, generateSuggestedQuestions, type SmartSummary } from './smart-summary'
import type { Document } from '@/types/documents'

// Helper to create mock documents
function createMockDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'test-id',
    userId: 'user-123',
    filename: 'test-document.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    storagePath: 'user-123/test.pdf',
    processingStatus: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides
  }
}

describe('generateSmartSummary', () => {
  describe('P&L documents', () => {
    it('extracts revenue, expenses, and net income from P&L PDF', () => {
      const doc = createMockDocument({
        filename: 'q1-2024-pl.pdf',
        extractedData: {
          documentType: 'pl',
          revenue: {
            total: 150000,
            lineItems: [{ description: 'Sales', amount: 150000 }]
          },
          expenses: {
            total: 100000,
            categories: [{ category: 'Rent', amount: 5000, lineItems: [] }]
          },
          netIncome: 50000,
          period: { startDate: '2024-01-01', endDate: '2024-03-31' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.documentType).toBe('pl')
      expect(summary.metrics).toHaveLength(3)
      expect(summary.metrics[0]).toEqual({ label: 'Revenue', value: '$150,000', type: 'currency' })
      expect(summary.metrics[1]).toEqual({ label: 'Expenses', value: '$100,000', type: 'currency' })
      expect(summary.metrics[2]).toEqual({ label: 'Net Income', value: '$50,000', type: 'currency' })
      expect(summary.itemCount).toBe(2) // 1 revenue line item + 1 expense category
      expect(summary.confidence).toBeGreaterThan(0.8)
    })

    it('calculates net income when not provided', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'income_statement',
          revenue: { total: 200000, lineItems: [] },
          expenses: { total: 150000, categories: [] },
          netIncome: 0, // Will be calculated from revenue - expenses
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.documentType).toBe('pl')
      // Net income is calculated when netIncome is 0 but we have both revenue and expenses
      expect(summary.metrics).toContainEqual({ label: 'Net Income', value: '$50,000', type: 'currency' })
    })

    it('handles P&L with string currency values', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'profit_loss',
          revenue: { total: '$125,000.00', lineItems: [] },
          expenses: { total: '$75,000.50', categories: [] },
          netIncome: 0,
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.metrics[0].value).toBe('$125,000')
      expect(summary.metrics[1].value).toBe('$75,001') // Rounds
    })
  })

  describe('Payroll documents', () => {
    it('extracts employee count and totals from payroll PDF', () => {
      const doc = createMockDocument({
        filename: 'payroll-jan-2024.pdf',
        extractedData: {
          documentType: 'payroll',
          payPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
          employees: [
            { name: 'John Doe', role: '', hoursWorked: 0, grossPay: 5000, taxes: 0, benefits: 0, netPay: 4000 },
            { name: 'Jane Smith', role: '', hoursWorked: 0, grossPay: 6000, taxes: 0, benefits: 0, netPay: 4800 },
            { name: 'Bob Wilson', role: '', hoursWorked: 0, grossPay: 4500, taxes: 0, benefits: 0, netPay: 3600 }
          ],
          totals: { totalGrossPay: 0, totalTaxes: 0, totalBenefits: 0, totalNetPay: 0, employeeCount: 0 },
          metadata: { companyName: '', payrollProvider: '' }
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.documentType).toBe('payroll')
      expect(summary.metrics).toContainEqual({ label: 'Employees', value: '3', type: 'number' })
      expect(summary.metrics).toContainEqual({ label: 'Total Gross', value: '$15,500', type: 'currency' })
      expect(summary.metrics).toContainEqual({ label: 'Total Net', value: '$12,400', type: 'currency' })
      expect(summary.itemCount).toBe(3)
    })

    it('handles payroll_summary document type', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'payroll_summary',
          payPeriod: { startDate: '', endDate: '' },
          employees: [{ name: 'Test', role: '', hoursWorked: 0, grossPay: 3000, taxes: 0, benefits: 0, netPay: 2400 }],
          totals: { totalGrossPay: 0, totalTaxes: 0, totalBenefits: 0, totalNetPay: 0, employeeCount: 0 },
          metadata: { companyName: '', payrollProvider: '' }
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.documentType).toBe('payroll')
    })
  })

  describe('Expense documents', () => {
    it('extracts totals and top category from expense PDF', () => {
      const doc = createMockDocument({
        filename: 'monthly-expenses.pdf',
        extractedData: {
          documentType: 'expense_report',
          period: { month: 'January 2024', startDate: '2024-01-01', endDate: '2024-01-31' },
          summary: {
            totalExpenses: 25000,
            categories: [
              { category: 'Office', currentPeriod: 5000, priorPeriod: 0, yearToDate: 0, budget: 0, variance: 0 },
              { category: 'Software', currentPeriod: 15000, priorPeriod: 0, yearToDate: 0, budget: 0, variance: 0 },
              { category: 'Travel', currentPeriod: 5000, priorPeriod: 0, yearToDate: 0, budget: 0, variance: 0 }
            ]
          },
          lineItems: [
            { date: '2024-01-10', vendor: 'Office Depot', description: 'Supplies', category: 'Office', amount: 5000, paymentMethod: '' },
            { date: '2024-01-15', vendor: 'Adobe', description: 'License', category: 'Software', amount: 15000, paymentMethod: '' },
            { date: '2024-01-20', vendor: 'Delta', description: 'Flight', category: 'Travel', amount: 5000, paymentMethod: '' }
          ],
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.documentType).toBe('expense')
      expect(summary.metrics).toContainEqual({ label: 'Total', value: '$25,000', type: 'currency' })
      expect(summary.metrics).toContainEqual({ label: 'Top: Software', value: '$15,000', type: 'currency' })
      expect(summary.itemCount).toBe(3)
    })

    it('calculates total from line items when not provided', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'operating_expenses',
          period: { month: '', startDate: '', endDate: '' },
          summary: { totalExpenses: 0, categories: [] },
          lineItems: [
            { date: '', vendor: '', description: '', category: 'Rent', amount: 10000, paymentMethod: '' },
            { date: '', vendor: '', description: '', category: 'Utilities', amount: 2000, paymentMethod: '' }
          ],
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.metrics[0]).toEqual({ label: 'Total', value: '$12,000', type: 'currency' })
    })
  })

  describe('CSV documents', () => {
    it('summarizes employee CSV with salary data', () => {
      const doc = createMockDocument({
        fileType: 'csv',
        filename: 'employees.csv',
        csvType: 'employees',
        rowCount: 25,
        extractedData: {
          headers: ['name', 'role', 'annual_salary', 'department'],
          preview: [
            { name: 'Alice', role: 'Engineer', annual_salary: 120000, department: 'Engineering' },
            { name: 'Bob', role: 'Designer', annual_salary: 100000, department: 'Design' },
            { name: 'Carol', role: 'Engineer', annual_salary: 130000, department: 'Engineering' }
          ]
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.documentType).toBe('employees')
      expect(summary.metrics).toContainEqual({ label: 'Employees', value: '3', type: 'number' })
      expect(summary.metrics).toContainEqual({ label: 'Total Salaries', value: '$350,000', type: 'currency' })
      expect(summary.metrics).toContainEqual({ label: 'Avg Salary', value: '$116,667', type: 'currency' })
      expect(summary.itemCount).toBe(25) // Uses document rowCount
    })

    it('counts unique roles in employee data', () => {
      const doc = createMockDocument({
        fileType: 'csv',
        csvType: 'employees',
        extractedData: {
          headers: ['name', 'role'],
          preview: [
            { name: 'A', role: 'Engineer' },
            { name: 'B', role: 'Engineer' },
            { name: 'C', role: 'Designer' },
            { name: 'D', role: 'Manager' }
          ]
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.metrics).toContainEqual({ label: 'Roles', value: '3', type: 'number' })
    })

    it('summarizes generic CSV with numeric columns', () => {
      const doc = createMockDocument({
        fileType: 'csv',
        filename: 'transactions.csv',
        csvType: 'unknown',
        extractedData: {
          headers: ['date', 'description', 'amount'],
          preview: [
            { date: '2024-01-01', description: 'Sale', amount: 5000 },
            { date: '2024-01-02', description: 'Sale', amount: 3000 },
            { date: '2024-01-03', description: 'Sale', amount: 7000 }
          ]
        }
      })

      const summary = generateSmartSummary(doc)

      expect(summary.metrics).toContainEqual({ label: 'Rows', value: '3', type: 'number' })
      expect(summary.metrics).toContainEqual({ label: 'Columns', value: '3', type: 'number' })
      expect(summary.metrics).toContainEqual({ label: 'Total amount', value: '$15,000', type: 'currency' })
    })
  })

  describe('Title generation', () => {
    it('generates readable title from filename', () => {
      const doc = createMockDocument({
        filename: 'q1-2024-financial-report.pdf',
        extractedData: { documentType: 'pl' }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.title).toBe('Q1 2024 Financial Report')
    })

    it('uses document type for generic filenames', () => {
      const doc = createMockDocument({
        filename: '2024-01.pdf',
        extractedData: { documentType: 'payroll' }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.title).toBe('Payroll Report')
    })

    it('cleans up underscores and hyphens', () => {
      const doc = createMockDocument({
        filename: 'employee_headcount_report.csv',
        fileType: 'csv',
        csvType: 'employees',
        extractedData: { headers: [], preview: [] }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.title).toBe('Employee Headcount Report')
    })
  })

  describe('Date range extraction', () => {
    it('extracts date range from P&L period', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 10000, lineItems: [] },
          expenses: { total: 5000, categories: [] },
          netIncome: 5000,
          period: { startDate: '2024-01-15', endDate: '2024-03-20' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.dateRange).toEqual({
        start: 'Jan 2024',
        end: 'Mar 2024'
      })
    })

    it('extracts date range from payroll payPeriod', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'payroll',
          payPeriod: { startDate: '2024-06-01', endDate: '2024-06-15' },
          employees: [
            { name: 'Test', role: '', hoursWorked: 0, grossPay: 1000, taxes: 0, benefits: 0, netPay: 800 }
          ],
          totals: { totalGrossPay: 0, totalTaxes: 0, totalBenefits: 0, totalNetPay: 0, employeeCount: 0 },
          metadata: { companyName: '', payrollProvider: '' }
        }
      })

      const summary = generateSmartSummary(doc)
      // Date parsing is timezone-dependent, just check we got a date range
      expect(summary.dateRange?.start).toBeDefined()
      expect(summary.dateRange?.start).toContain('2024')
    })
  })

  describe('Confidence scoring', () => {
    it('has higher confidence for complete P&L data', () => {
      const complete = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 100000, lineItems: [] },
          expenses: { total: 80000, categories: [] },
          netIncome: 20000,
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const incomplete = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 0, lineItems: [] },
          expenses: { total: 0, categories: [] },
          netIncome: 0,
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const completeSummary = generateSmartSummary(complete)
      const incompleteSummary = generateSmartSummary(incomplete)

      expect(completeSummary.confidence).toBeGreaterThan(incompleteSummary.confidence)
    })

    it('limits confidence to 1.0 maximum', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 100000, lineItems: Array(50).fill({ description: 'Item', amount: 100 }) },
          expenses: { total: 80000, categories: Array(50).fill({ category: 'Cat', amount: 100, lineItems: [] }) },
          netIncome: 20000,
          period: { startDate: '2024-01-01', endDate: '2024-01-31' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Edge cases', () => {
    it('handles empty extracted data', () => {
      const doc = createMockDocument({
        extractedData: {}
      })

      const summary = generateSmartSummary(doc)

      expect(summary.title).toBeTruthy()
      expect(summary.metrics).toBeDefined()
      expect(summary.confidence).toBeGreaterThan(0)
    })

    it('handles undefined extracted data', () => {
      const doc = createMockDocument({
        extractedData: undefined
      })

      const summary = generateSmartSummary(doc)

      expect(summary.title).toBeTruthy()
      expect(summary.documentType).toBe('pdf')
    })

    it('handles negative numbers', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 50000, lineItems: [] },
          expenses: { total: 70000, categories: [] },
          netIncome: -20000,
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)
      expect(summary.metrics).toContainEqual({ label: 'Net Income', value: '-$20,000', type: 'currency' })
    })

    it('handles zero values', () => {
      const doc = createMockDocument({
        extractedData: {
          documentType: 'pl',
          revenue: { total: 0, lineItems: [] },
          expenses: { total: 0, categories: [] },
          netIncome: 0,
          period: { startDate: '', endDate: '' },
          metadata: { companyName: '', preparedBy: '', pageCount: 1 }
        }
      })

      const summary = generateSmartSummary(doc)
      // Should not include zero revenue/expenses as metrics since they add no value
      expect(summary.metrics.some(m => m.value === '$0')).toBe(false)
    })
  })
})

describe('generateSuggestedQuestions', () => {
  it('returns P&L-specific questions', () => {
    const summary: SmartSummary = {
      title: 'Test',
      documentType: 'pl',
      metrics: [],
      confidence: 0.8
    }

    const questions = generateSuggestedQuestions(summary)

    expect(questions).toHaveLength(3)
    expect(questions[0]).toContain('expense')
  })

  it('returns payroll-specific questions', () => {
    const summary: SmartSummary = {
      title: 'Test',
      documentType: 'payroll',
      metrics: [],
      confidence: 0.8
    }

    const questions = generateSuggestedQuestions(summary)

    expect(questions).toHaveLength(3)
    expect(questions.some(q => q.toLowerCase().includes('employee') || q.toLowerCase().includes('payroll'))).toBe(true)
  })

  it('returns expense-specific questions', () => {
    const summary: SmartSummary = {
      title: 'Test',
      documentType: 'expense',
      metrics: [],
      confidence: 0.8
    }

    const questions = generateSuggestedQuestions(summary)

    expect(questions).toHaveLength(3)
    expect(questions[0]).toContain('spending')
  })

  it('returns employee-specific questions', () => {
    const summary: SmartSummary = {
      title: 'Test',
      documentType: 'employees',
      metrics: [],
      confidence: 0.8
    }

    const questions = generateSuggestedQuestions(summary)

    expect(questions).toHaveLength(3)
    expect(questions.some(q => q.toLowerCase().includes('payroll') || q.toLowerCase().includes('headcount'))).toBe(true)
  })

  it('returns generic questions for unknown types', () => {
    const summary: SmartSummary = {
      title: 'Test',
      documentType: 'unknown',
      metrics: [],
      confidence: 0.5
    }

    const questions = generateSuggestedQuestions(summary)

    expect(questions).toHaveLength(3)
    expect(questions[0]).toContain('insights')
  })
})
