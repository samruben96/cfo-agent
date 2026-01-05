import { describe, it, expect } from 'vitest'

import type { Employee } from '@/types/employees'
import type { OverheadCosts } from '@/types/overhead-costs'

import {
  calculateFullyLoadedCost,
  calculateTotalMonthlyOverhead,
  PAYROLL_TAX_RATE,
} from './employee-cost'

// Test fixtures
const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  userId: 'user-1',
  name: 'John Doe',
  role: 'Producer',
  department: 'Sales',
  employmentType: 'full-time',
  annualSalary: 100000,
  annualBenefits: 15000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createMockOverhead = (overrides: Partial<OverheadCosts> = {}): OverheadCosts => ({
  id: 'overhead-1',
  userId: 'user-1',
  monthlyRent: 5000,
  monthlyUtilities: 500,
  monthlyInsurance: 1000,
  otherMonthlyCosts: 500,
  softwareCosts: [
    { id: 'sw-1', name: 'Slack', monthlyCost: 200 },
    { id: 'sw-2', name: 'QuickBooks', monthlyCost: 100 },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('PAYROLL_TAX_RATE', () => {
  it('is 7.65% for employer FICA', () => {
    expect(PAYROLL_TAX_RATE).toBe(0.0765)
  })
})

describe('calculateTotalMonthlyOverhead', () => {
  it('calculates total monthly overhead including all components', () => {
    const overhead = createMockOverhead()
    const total = calculateTotalMonthlyOverhead(overhead)

    // 5000 + 500 + 1000 + 500 + 200 + 100 = 7300
    expect(total).toBe(7300)
  })

  it('handles empty software costs array', () => {
    const overhead = createMockOverhead({ softwareCosts: [] })
    const total = calculateTotalMonthlyOverhead(overhead)

    // 5000 + 500 + 1000 + 500 = 7000
    expect(total).toBe(7000)
  })

  it('handles zero values', () => {
    const overhead = createMockOverhead({
      monthlyRent: 0,
      monthlyUtilities: 0,
      monthlyInsurance: 0,
      otherMonthlyCosts: 0,
      softwareCosts: [],
    })
    const total = calculateTotalMonthlyOverhead(overhead)
    expect(total).toBe(0)
  })
})

describe('calculateFullyLoadedCost', () => {
  it('calculates correctly with all data present', () => {
    const employee = createMockEmployee()
    const overhead = createMockOverhead()
    const headcount = 5

    const result = calculateFullyLoadedCost(employee, overhead, headcount)

    // baseSalary = 100000
    // payrollTaxes = 100000 * 0.0765 = 7650
    // benefits = 15000
    // totalMonthlyOverhead = 7300, annual = 7300 * 12 = 87600
    // allocatedOverhead = 87600 / 5 = 17520
    // fullyLoadedCost = 100000 + 7650 + 15000 + 17520 = 140170

    expect(result.baseSalary).toBe(100000)
    expect(result.payrollTaxes).toBe(7650)
    expect(result.benefits).toBe(15000)
    expect(result.allocatedOverhead).toBe(17520)
    expect(result.fullyLoadedCost).toBe(140170)
    expect(result.annualCost).toBe(140170)
    expect(result.monthlyCost).toBeCloseTo(11680.83, 2)
  })

  it('handles missing benefits (defaults to 0)', () => {
    const employee = createMockEmployee({ annualBenefits: 0 })
    const overhead = createMockOverhead()
    const headcount = 5

    const result = calculateFullyLoadedCost(employee, overhead, headcount)

    expect(result.benefits).toBe(0)
    // fullyLoadedCost = 100000 + 7650 + 0 + 17520 = 125170
    expect(result.fullyLoadedCost).toBe(125170)
  })

  it('handles missing overhead (null)', () => {
    const employee = createMockEmployee()
    const headcount = 5

    const result = calculateFullyLoadedCost(employee, null, headcount)

    expect(result.allocatedOverhead).toBe(0)
    // fullyLoadedCost = 100000 + 7650 + 15000 + 0 = 122650
    expect(result.fullyLoadedCost).toBe(122650)
  })

  it('calculates payroll taxes at 7.65%', () => {
    const employee = createMockEmployee({ annualSalary: 50000 })
    const result = calculateFullyLoadedCost(employee, null, 1)

    // 50000 * 0.0765 = 3825
    expect(result.payrollTaxes).toBe(3825)
  })

  it('allocates overhead evenly across headcount', () => {
    const employee = createMockEmployee()
    const overhead = createMockOverhead()

    // With 1 employee, they get all the overhead
    const result1 = calculateFullyLoadedCost(employee, overhead, 1)
    expect(result1.allocatedOverhead).toBe(87600) // 7300 * 12

    // With 10 employees, each gets 1/10
    const result10 = calculateFullyLoadedCost(employee, overhead, 10)
    expect(result10.allocatedOverhead).toBe(8760) // 87600 / 10
  })

  it('returns monthly and annual costs', () => {
    const employee = createMockEmployee({ annualSalary: 120000, annualBenefits: 0 })
    const result = calculateFullyLoadedCost(employee, null, 1)

    // fullyLoadedCost = 120000 + (120000 * 0.0765) = 120000 + 9180 = 129180
    expect(result.annualCost).toBe(129180)
    expect(result.monthlyCost).toBe(10765) // 129180 / 12
  })

  it('includes correct employee metadata', () => {
    const employee = createMockEmployee({
      id: 'test-emp',
      name: 'Jane Smith',
      role: 'CSR',
      department: 'Service',
      employmentType: 'part-time',
    })

    const result = calculateFullyLoadedCost(employee, null, 1)

    expect(result.employeeId).toBe('test-emp')
    expect(result.employeeName).toBe('Jane Smith')
    expect(result.role).toBe('CSR')
    expect(result.department).toBe('Service')
    expect(result.employmentType).toBe('part-time')
  })

  it('handles headcount of 1', () => {
    const employee = createMockEmployee()
    const overhead = createMockOverhead()

    const result = calculateFullyLoadedCost(employee, overhead, 1)

    // All overhead allocated to single employee
    expect(result.allocatedOverhead).toBe(87600)
  })

  it('handles undefined department', () => {
    const employee = createMockEmployee({ department: undefined })
    const result = calculateFullyLoadedCost(employee, null, 1)

    expect(result.department).toBeUndefined()
  })

  it('rounds allocatedOverhead to avoid floating point issues', () => {
    const employee = createMockEmployee()
    const overhead = createMockOverhead({
      monthlyRent: 3333,
      monthlyUtilities: 333,
      monthlyInsurance: 333,
      otherMonthlyCosts: 1,
      softwareCosts: [],
    })

    const result = calculateFullyLoadedCost(employee, overhead, 3)

    // (4000 * 12) / 3 = 16000 - should be clean, no floating point issues
    expect(result.allocatedOverhead).toBe(16000)
  })
})
