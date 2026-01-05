import { describe, it, expect } from 'vitest'

import type { Employee } from '@/types/employees'
import type { OverheadCosts } from '@/types/overhead-costs'

import { calculateAllEmployeeCosts, calculateCostSummary } from './aggregation'
import type { EmployeeCostBreakdown } from './types'

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

const createMockOverhead = (): OverheadCosts => ({
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
})

const createMockBreakdown = (overrides: Partial<EmployeeCostBreakdown> = {}): EmployeeCostBreakdown => ({
  employeeId: 'emp-1',
  employeeName: 'John Doe',
  role: 'Producer',
  department: 'Sales',
  employmentType: 'full-time',
  baseSalary: 100000,
  payrollTaxes: 7650,
  benefits: 15000,
  allocatedOverhead: 17520,
  fullyLoadedCost: 140170,
  annualCost: 140170,
  monthlyCost: 11680.83,
  ...overrides,
})

describe('calculateAllEmployeeCosts', () => {
  it('calculates costs for multiple employees', () => {
    const employees = [
      createMockEmployee({ id: 'emp-1', name: 'John Doe', annualSalary: 100000 }),
      createMockEmployee({ id: 'emp-2', name: 'Jane Smith', annualSalary: 80000 }),
    ]
    const overhead = createMockOverhead()

    const result = calculateAllEmployeeCosts(employees, overhead)

    expect(result).toHaveLength(2)
    expect(result[0].employeeName).toBe('John Doe')
    expect(result[1].employeeName).toBe('Jane Smith')
  })

  it('allocates overhead evenly across employees', () => {
    const employees = [
      createMockEmployee({ id: 'emp-1', annualSalary: 100000 }),
      createMockEmployee({ id: 'emp-2', annualSalary: 80000 }),
    ]
    const overhead = createMockOverhead()

    const result = calculateAllEmployeeCosts(employees, overhead)

    // Total monthly overhead = 7300, annual = 87600
    // Split 2 ways = 43800 each
    expect(result[0].allocatedOverhead).toBe(43800)
    expect(result[1].allocatedOverhead).toBe(43800)
  })

  it('handles empty employee array', () => {
    const result = calculateAllEmployeeCosts([], createMockOverhead())
    expect(result).toHaveLength(0)
  })

  it('handles missing overhead', () => {
    const employees = [createMockEmployee()]
    const result = calculateAllEmployeeCosts(employees, null)

    expect(result[0].allocatedOverhead).toBe(0)
  })

  it('returns correct structure for each employee', () => {
    const employee = createMockEmployee({
      id: 'test-id',
      name: 'Test User',
      role: 'CSR',
      department: 'Service',
      employmentType: 'part-time',
      annualSalary: 50000,
      annualBenefits: 5000,
    })

    const result = calculateAllEmployeeCosts([employee], null)

    expect(result[0].employeeId).toBe('test-id')
    expect(result[0].employeeName).toBe('Test User')
    expect(result[0].role).toBe('CSR')
    expect(result[0].department).toBe('Service')
    expect(result[0].employmentType).toBe('part-time')
    expect(result[0].baseSalary).toBe(50000)
    expect(result[0].benefits).toBe(5000)
  })
})

describe('calculateCostSummary', () => {
  it('aggregates all employee costs', () => {
    const breakdowns: EmployeeCostBreakdown[] = [
      createMockBreakdown({
        baseSalary: 100000,
        payrollTaxes: 7650,
        benefits: 15000,
        allocatedOverhead: 43800,
        fullyLoadedCost: 166450,
      }),
      createMockBreakdown({
        employeeId: 'emp-2',
        baseSalary: 80000,
        payrollTaxes: 6120,
        benefits: 10000,
        allocatedOverhead: 43800,
        fullyLoadedCost: 139920,
      }),
    ]

    const hasOverheadData = true
    const summary = calculateCostSummary(breakdowns, hasOverheadData)

    expect(summary.totalHeadcount).toBe(2)
    expect(summary.totalBaseSalary).toBe(180000)
    expect(summary.totalPayrollTaxes).toBe(13770)
    expect(summary.totalBenefits).toBe(25000)
    expect(summary.totalOverheadAllocated).toBe(87600)
    expect(summary.totalFullyLoadedCost).toBe(306370)
  })

  it('calculates correct averages', () => {
    const breakdowns: EmployeeCostBreakdown[] = [
      createMockBreakdown({ fullyLoadedCost: 100000 }),
      createMockBreakdown({ employeeId: 'emp-2', fullyLoadedCost: 200000 }),
    ]

    const summary = calculateCostSummary(breakdowns, true)

    expect(summary.averageFullyLoadedCost).toBe(150000) // (100000 + 200000) / 2
  })

  it('tracks data completeness - has overhead data', () => {
    const breakdowns = [createMockBreakdown()]

    const summaryWithOverhead = calculateCostSummary(breakdowns, true)
    expect(summaryWithOverhead.hasOverheadData).toBe(true)
    expect(summaryWithOverhead.missingDataWarnings).not.toContain(
      'Overhead data not available. Allocated overhead is not included in calculations.'
    )

    const summaryWithoutOverhead = calculateCostSummary(breakdowns, false)
    expect(summaryWithoutOverhead.hasOverheadData).toBe(false)
    expect(summaryWithoutOverhead.missingDataWarnings).toContain(
      'Overhead data not available. Allocated overhead is not included in calculations.'
    )
  })

  it('tracks data completeness - has benefits data', () => {
    const withBenefits = [createMockBreakdown({ benefits: 15000 })]
    const withoutBenefits = [createMockBreakdown({ benefits: 0 })]

    const summaryWithBenefits = calculateCostSummary(withBenefits, true)
    expect(summaryWithBenefits.hasBenefitsData).toBe(true)

    const summaryWithoutBenefits = calculateCostSummary(withoutBenefits, true)
    expect(summaryWithoutBenefits.hasBenefitsData).toBe(false)
  })

  it('adds warning for employees without benefits', () => {
    const breakdowns = [
      createMockBreakdown({ employeeName: 'John', benefits: 0 }),
      createMockBreakdown({ employeeId: 'emp-2', employeeName: 'Jane', benefits: 10000 }),
    ]

    const summary = calculateCostSummary(breakdowns, true)

    expect(summary.missingDataWarnings).toContain(
      'Benefits not specified for 1 employee(s).'
    )
  })

  it('handles empty employee array', () => {
    const summary = calculateCostSummary([], true)

    expect(summary.totalHeadcount).toBe(0)
    expect(summary.totalFullyLoadedCost).toBe(0)
    expect(summary.averageFullyLoadedCost).toBe(0)
    expect(summary.totalBaseSalary).toBe(0)
    expect(summary.totalPayrollTaxes).toBe(0)
    expect(summary.totalBenefits).toBe(0)
    expect(summary.totalOverheadAllocated).toBe(0)
    expect(summary.hasBenefitsData).toBe(false)
  })

  it('does not add missing benefits warning when all employees have benefits', () => {
    const breakdowns = [
      createMockBreakdown({ benefits: 15000 }),
      createMockBreakdown({ employeeId: 'emp-2', benefits: 10000 }),
    ]

    const summary = calculateCostSummary(breakdowns, true)

    const hasMissingBenefitsWarning = summary.missingDataWarnings.some(
      (w) => w.includes('Benefits not specified')
    )
    expect(hasMissingBenefitsWarning).toBe(false)
  })
})
