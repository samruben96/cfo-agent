/**
 * Unit tests for overhead costs server actions
 * Story: 3-1-overhead-cost-intake-form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { OverheadCostsFormData } from '@/types/overhead-costs'

// Mock the Supabase client
const mockSelectResult = vi.fn()
const mockUpsertSelectResult = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpsertSingle = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}))

// Import after mocking
import { getOverheadCosts, saveOverheadCosts } from './overhead-costs'

describe('overhead-costs actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default chain for from().select().eq().single()
    // and from().upsert().select().single()
    mockFrom.mockReturnValue({
      select: mockSelectResult,
      upsert: vi.fn().mockReturnValue({
        select: mockUpsertSelectResult,
      }),
    })
    mockSelectResult.mockReturnValue({ eq: mockEq })
    mockUpsertSelectResult.mockReturnValue({ single: mockUpsertSingle })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  describe('getOverheadCosts', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await getOverheadCosts()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('returns null data (not error) when no overhead costs exist', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await getOverheadCosts()

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('returns transformed overhead costs when data exists', async () => {
      const mockRow = {
        id: 'overhead-123',
        user_id: 'user-123',
        monthly_rent: 2000,
        monthly_utilities: 150,
        monthly_insurance: 500,
        other_monthly_costs: 100,
        software_costs: [
          { name: 'Slack', monthly_cost: 25 },
          { name: 'QuickBooks', monthly_cost: 50 },
        ],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: mockRow,
        error: null,
      })

      const result = await getOverheadCosts()

      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        id: 'overhead-123',
        userId: 'user-123',
        monthlyRent: 2000,
        monthlyUtilities: 150,
        monthlyInsurance: 500,
        otherMonthlyCosts: 100,
        softwareCosts: [
          { id: 'software-0-overhead-123', name: 'Slack', monthlyCost: 25 },
          { id: 'software-1-overhead-123', name: 'QuickBooks', monthlyCost: 50 },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      })
    })

    it('returns error for database errors (not PGRST116)', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'XXXXX', message: 'Database error' },
      })

      const result = await getOverheadCosts()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to load overhead costs')
    })

    it('handles null software_costs gracefully', async () => {
      const mockRow = {
        id: 'overhead-123',
        user_id: 'user-123',
        monthly_rent: 1000,
        monthly_utilities: null,
        monthly_insurance: null,
        other_monthly_costs: null,
        software_costs: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: mockRow,
        error: null,
      })

      const result = await getOverheadCosts()

      expect(result.error).toBeNull()
      expect(result.data?.softwareCosts).toEqual([])
      expect(result.data?.monthlyUtilities).toBe(0)
    })
  })

  describe('saveOverheadCosts', () => {
    const validFormData: OverheadCostsFormData = {
      monthlyRent: 2000,
      monthlyUtilities: 150,
      monthlyInsurance: 500,
      otherMonthlyCosts: 100,
      softwareCosts: [
        { id: 'temp-1', name: 'Slack', monthlyCost: 25 },
        { id: 'temp-2', name: 'QuickBooks', monthlyCost: 50 },
      ],
    }

    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await saveOverheadCosts(validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('saves overhead costs with upsert pattern', async () => {
      const savedRow = {
        id: 'overhead-123',
        user_id: 'user-123',
        monthly_rent: 2000,
        monthly_utilities: 150,
        monthly_insurance: 500,
        other_monthly_costs: 100,
        software_costs: [
          { name: 'Slack', monthly_cost: 25 },
          { name: 'QuickBooks', monthly_cost: 50 },
        ],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockUpsertSingle.mockResolvedValue({
        data: savedRow,
        error: null,
      })

      const result = await saveOverheadCosts(validFormData)

      expect(result.error).toBeNull()
      expect(result.data?.monthlyRent).toBe(2000)
      expect(result.data?.softwareCosts).toHaveLength(2)
    })

    it('filters out empty software names', async () => {
      const formDataWithEmpty: OverheadCostsFormData = {
        monthlyRent: 1000,
        monthlyUtilities: null,
        monthlyInsurance: null,
        otherMonthlyCosts: null,
        softwareCosts: [
          { id: 'temp-1', name: 'Slack', monthlyCost: 25 },
          { id: 'temp-2', name: '', monthlyCost: 0 },
          { id: 'temp-3', name: '   ', monthlyCost: 50 },
        ],
      }

      const savedRow = {
        id: 'overhead-123',
        user_id: 'user-123',
        monthly_rent: 1000,
        monthly_utilities: 0,
        monthly_insurance: 0,
        other_monthly_costs: 0,
        software_costs: [{ name: 'Slack', monthly_cost: 25 }],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockUpsertSingle.mockResolvedValue({
        data: savedRow,
        error: null,
      })

      const result = await saveOverheadCosts(formDataWithEmpty)

      // Verify successful save - empty names filtered out
      expect(result.error).toBeNull()
      expect(result.data?.softwareCosts).toHaveLength(1)
    })

    it('converts null form values to 0', async () => {
      const formDataWithNulls: OverheadCostsFormData = {
        monthlyRent: null,
        monthlyUtilities: null,
        monthlyInsurance: 500,
        otherMonthlyCosts: null,
        softwareCosts: [],
      }

      const savedRow = {
        id: 'overhead-123',
        user_id: 'user-123',
        monthly_rent: 0,
        monthly_utilities: 0,
        monthly_insurance: 500,
        other_monthly_costs: 0,
        software_costs: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockUpsertSingle.mockResolvedValue({
        data: savedRow,
        error: null,
      })

      const result = await saveOverheadCosts(formDataWithNulls)

      // Verify successful save with converted null values
      expect(result.error).toBeNull()
      expect(result.data?.monthlyRent).toBe(0)
      expect(result.data?.monthlyInsurance).toBe(500)
    })

    it('returns error for database save failures', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockUpsertSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await saveOverheadCosts(validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to save overhead costs')
    })
  })
})
