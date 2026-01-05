import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the calculations action
vi.mock('@/actions/calculations', () => ({
  getFullyLoadedEmployeeCosts: vi.fn(),
}))

import { getFullyLoadedEmployeeCosts } from '@/actions/calculations'
import { createEmployeeCostTools } from './employee-cost-tools'

import type { EmployeeCostResult } from '@/lib/calculations'

const mockResult: EmployeeCostResult = {
  employees: [
    {
      employeeId: 'emp-1',
      employeeName: 'John Doe',
      role: 'Producer',
      department: 'Sales',
      employmentType: 'full-time',
      baseSalary: 100000,
      payrollTaxes: 7650,
      benefits: 15000,
      allocatedOverhead: 43800,
      fullyLoadedCost: 166450,
      annualCost: 166450,
      monthlyCost: 13870.83,
    },
    {
      employeeId: 'emp-2',
      employeeName: 'Jane Smith',
      role: 'CSR',
      department: 'Service',
      employmentType: 'full-time',
      baseSalary: 60000,
      payrollTaxes: 4590,
      benefits: 10000,
      allocatedOverhead: 43800,
      fullyLoadedCost: 118390,
      annualCost: 118390,
      monthlyCost: 9865.83,
    },
  ],
  summary: {
    totalHeadcount: 2,
    totalFullyLoadedCost: 284840,
    averageFullyLoadedCost: 142420,
    totalBaseSalary: 160000,
    totalPayrollTaxes: 12240,
    totalBenefits: 25000,
    totalOverheadAllocated: 87600,
    hasOverheadData: true,
    hasBenefitsData: true,
    missingDataWarnings: [],
  },
  dataSource: {
    employeesSource: 'manual',
    overheadSource: 'manual',
    lastUpdated: '2024-01-15T00:00:00Z',
  },
}

describe('createEmployeeCostTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get_employee_costs', () => {
    it('returns detailed breakdown when includeDetails is true', async () => {
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({ data: mockResult, error: null })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({ includeDetails: true })

      expect(result.success).toBe(true)
      expect(result.message).toContain('John Doe')
      expect(result.message).toContain('Jane Smith')
      expect(result.message).toContain('$166,450')
      expect(result.data?.employees).toHaveLength(2)
    })

    it('returns summary only when includeDetails is false', async () => {
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({ data: mockResult, error: null })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({ includeDetails: false })

      expect(result.success).toBe(true)
      expect(result.message).toContain('Employee Cost Summary')
      expect(result.message).toContain('Total Headcount')
      expect(result.data?.employees).toHaveLength(0) // Summary only
    })

    it('defaults to detailed breakdown', async () => {
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({ data: mockResult, error: null })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({})

      expect(result.success).toBe(true)
      expect(result.data?.employees).toHaveLength(2)
    })

    it('returns error message when no employees found', async () => {
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({
        data: null,
        error: 'No employees found. Add employees first to calculate costs.',
      })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({})

      expect(result.success).toBe(false)
      expect(result.message).toBe('No employees found. Add employees first to calculate costs.')
      expect(result.data).toBeNull()
    })

    it('includes data source attribution in message', async () => {
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({ data: mockResult, error: null })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({ includeDetails: false })

      expect(result.message).toContain('Employee data: manual')
      expect(result.message).toContain('Overhead data: manual')
    })

    it('includes warnings in message when data is incomplete', async () => {
      const resultWithWarnings: EmployeeCostResult = {
        ...mockResult,
        summary: {
          ...mockResult.summary,
          hasOverheadData: false,
          missingDataWarnings: [
            'Overhead data not available. Allocated overhead is not included in calculations.',
          ],
        },
      }
      const mockGetCosts = getFullyLoadedEmployeeCosts as ReturnType<typeof vi.fn>
      mockGetCosts.mockResolvedValue({ data: resultWithWarnings, error: null })

      const tools = createEmployeeCostTools()
      const result = await tools.get_employee_costs.execute({ includeDetails: false })

      expect(result.message).toContain('⚠️ Notes')
      expect(result.message).toContain('Overhead data not available')
    })
  })

  describe('explain_employee_cost_formula', () => {
    it('returns formula explanation', async () => {
      const tools = createEmployeeCostTools()
      const result = await tools.explain_employee_cost_formula.execute({})

      expect(result.success).toBe(true)
      expect(result.message).toContain('Fully Loaded Employee Cost Formula')
      expect(result.message).toContain('Base Salary')
      expect(result.message).toContain('Payroll Taxes')
      expect(result.message).toContain('7.65%')
      expect(result.message).toContain('Allocated Overhead')
    })

    it('includes example calculation', async () => {
      const tools = createEmployeeCostTools()
      const result = await tools.explain_employee_cost_formula.execute({})

      expect(result.message).toContain('Example')
      expect(result.message).toContain('$100,000')
      expect(result.message).toContain('$140,170')
    })
  })
})
