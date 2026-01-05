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
import { getFullyLoadedEmployeeCosts } from './calculations'

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
