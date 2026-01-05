import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Import after mocking
import { getFullyLoadedEmployeeCosts, getEBITDA } from './calculations'

// Test fixtures
const mockUser = { id: 'user-123' }

const mockEmployees = [
  {
    id: 'emp-1',
    user_id: 'user-123',
    name: 'John Doe',
    employee_id: null,
    role: 'Producer',
    department: 'Sales',
    employment_type: 'full-time',
    annual_salary: 100000,
    annual_benefits: 15000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'emp-2',
    user_id: 'user-123',
    name: 'Jane Smith',
    employee_id: 'E002',
    role: 'CSR',
    department: 'Service',
    employment_type: 'full-time',
    annual_salary: 60000,
    annual_benefits: 10000,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const mockOverhead = {
  id: 'overhead-1',
  user_id: 'user-123',
  monthly_rent: 5000,
  monthly_utilities: 500,
  monthly_insurance: 1000,
  other_monthly_costs: 500,
  software_costs: [
    { name: 'Slack', monthly_cost: 200 },
    { name: 'QuickBooks', monthly_cost: 100 },
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockProfile = {
  employee_count: 2,
  monthly_overhead_estimate: 8000,
}

const mockProfileWithRevenue = {
  annual_revenue_range: '1m-2m',
  monthly_overhead_estimate: 8000,
}

// P&L document mock for EBITDA tests
const mockPLDocument = {
  id: 'doc-pl-1',
  user_id: 'user-123',
  filename: 'pl-2024.pdf',
  file_size: 1024,
  file_type: 'pdf',
  storage_path: '/documents/pl-2024.pdf',
  processing_status: 'completed',
  extracted_data: {
    documentType: 'pl',
    period: { startDate: '2024-01-01', endDate: '2024-12-31' },
    revenue: { total: 500000, lineItems: [] },
    expenses: {
      total: 300000,
      categories: [
        { category: 'Payroll', amount: 200000, lineItems: [] },
        { category: 'Rent', amount: 50000, lineItems: [] },
        { category: 'Other', amount: 50000, lineItems: [] },
      ],
    },
    netIncome: 200000,
    metadata: { companyName: 'Test Agency', preparedBy: '', pageCount: 1 },
  },
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
}

// Non-P&L document for isPLDocument test coverage
const mockNonPLDocument = {
  id: 'doc-other-1',
  user_id: 'user-123',
  filename: 'expense-report.pdf',
  file_size: 512,
  file_type: 'pdf',
  storage_path: '/documents/expense-report.pdf',
  processing_status: 'completed',
  extracted_data: {
    documentType: 'expense',
    items: [],
  },
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-11-01T00:00:00Z',
}

describe('getFullyLoadedEmployeeCosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns employee cost breakdowns with all data present', async () => {
    // Setup mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data!.employees).toHaveLength(2)
    expect(result.data!.summary.totalHeadcount).toBe(2)
    expect(result.data!.dataSource.overheadSource).toBe('manual')
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.error).toBe('Not authenticated')
    expect(result.data).toBeNull()
  })

  it('returns appropriate message when no employees exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.error).toBe('No employees found. Add employees first to calculate costs.')
    expect(result.data).toBeNull()
  })

  it('handles missing overhead data', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { employee_count: 2, monthly_overhead_estimate: 8000 },
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.error).toBeNull()
    expect(result.data!.dataSource.overheadSource).toBe('profile_estimate')
    // With profile estimate of 8000/month, annual = 96000, per employee = 48000
    expect(result.data!.employees[0].allocatedOverhead).toBe(48000)
  })

  it('uses actual employee count over profile count', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Profile says 5 employees but we only have 2 in DB
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { employee_count: 5, monthly_overhead_estimate: 8000 },
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    // Should use actual employee count (2) for overhead allocation, not profile count (5)
    expect(result.data!.summary.totalHeadcount).toBe(2)
  })

  it('includes data source attribution', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.data!.dataSource).toBeDefined()
    expect(result.data!.dataSource.employeesSource).toBe('manual')
    expect(result.data!.dataSource.overheadSource).toBe('manual')
    expect(result.data!.dataSource.lastUpdated).toBeDefined()
  })

  it('falls back to "none" when no overhead data available', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { employee_count: 2, monthly_overhead_estimate: null },
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await getFullyLoadedEmployeeCosts()

    expect(result.data!.dataSource.overheadSource).toBe('none')
    expect(result.data!.summary.hasOverheadData).toBe(false)
  })
})

describe('getEBITDA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const result = await getEBITDA()

    expect(result.error).toBe('Not authenticated')
    expect(result.data).toBeNull()
  })

  it('returns error when no revenue data is available', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBe('No revenue data found. Upload a P&L statement or complete your profile.')
    expect(result.data).toBeNull()
  })

  it('calculates EBITDA correctly with P&L document (tests isPLDocument for "pl" type)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [mockPLDocument], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfileWithRevenue, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data!.breakdown.revenue).toBe(500000)
    expect(result.data!.breakdown.totalOperatingExpenses).toBe(300000)
    expect(result.data!.breakdown.ebitda).toBe(200000)
    expect(result.data!.breakdown.ebitdaMargin).toBe(40)
    expect(result.data!.breakdown.revenueSource.type).toBe('pl_document')
  })

  it('falls back to profile estimate when no P&L document (tests isPLDocument returns false for non-P&L)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [mockNonPLDocument], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfileWithRevenue, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    // Profile range '1m-2m' maps to midpoint 1,500,000
    expect(result.data!.breakdown.revenue).toBe(1500000)
    expect(result.data!.breakdown.revenueSource.type).toBe('profile_estimate')
    expect(result.data!.breakdown.revenueSource.confidence).toBe('low')
    // Should have warning about using estimate
    expect(result.data!.warnings).toContain(
      'Using estimated revenue from your profile. Upload a P&L statement for more accurate results.'
    )
  })

  it('combines overhead and payroll expenses when no P&L document', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfileWithRevenue, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOverhead, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }
      }
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()

    // Overhead: (5000 + 500 + 1000 + 500 + 200 + 100) * 12 = 87600
    // Payroll (from employee costs): calculated from mockEmployees
    expect(result.data!.dataCompleteness.hasPayrollData).toBe(true)
    expect(result.data!.dataCompleteness.hasOverheadData).toBe(true)
    expect(result.data!.breakdown.expenseCategories.length).toBeGreaterThan(0)
  })

  it('includes warning for negative EBITDA', async () => {
    // Create a P&L with expenses > revenue for negative EBITDA
    const negativePLDocument = {
      ...mockPLDocument,
      extracted_data: {
        ...mockPLDocument.extracted_data,
        revenue: { total: 100000, lineItems: [] },
        expenses: { total: 200000, categories: [] },
        netIncome: -100000,
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [negativePLDocument], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data!.breakdown.ebitda).toBe(-100000)
    expect(result.data!.warnings).toContain(
      'Your EBITDA is negative, indicating an operating loss. Consider reviewing expenses or strategies to increase revenue.'
    )
  })

  it('handles income_statement document type (tests isPLDocument variant)', async () => {
    const incomeStatementDoc = {
      ...mockPLDocument,
      extracted_data: {
        ...mockPLDocument.extracted_data,
        documentType: 'income_statement',
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [incomeStatementDoc], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data!.breakdown.revenueSource.type).toBe('pl_document')
  })

  it('handles profit_loss document type (tests isPLDocument variant)', async () => {
    const profitLossDoc = {
      ...mockPLDocument,
      extracted_data: {
        ...mockPLDocument.extracted_data,
        documentType: 'profit_loss',
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [profitLossDoc], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    expect(result.error).toBeNull()
    expect(result.data!.breakdown.revenueSource.type).toBe('pl_document')
  })

  it('ignores documents with null extracted_data (tests isPLDocument for null)', async () => {
    const nullDataDoc = {
      ...mockPLDocument,
      extracted_data: null,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [nullDataDoc], error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfileWithRevenue, error: null }),
        }
      }
      if (table === 'overhead_costs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {}
    })

    const result = await getEBITDA()

    // Should fall back to profile estimate since doc has null extracted_data
    expect(result.error).toBeNull()
    expect(result.data!.breakdown.revenueSource.type).toBe('profile_estimate')
  })
})
