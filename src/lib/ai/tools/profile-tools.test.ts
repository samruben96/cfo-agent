import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  createProfileTools,
  rentSchema,
  employeeCountSchema,
  overheadSchema,
  softwareSpendSchema,
} from './profile-tools'

import type { SupabaseClient } from '@supabase/supabase-js'

describe('createProfileTools', () => {
  const mockUserId = 'user-123'
  let mockSupabase: ReturnType<typeof createMockSupabase>

  const createMockSupabase = (updateResult: { error: Error | null } = { error: null }) => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(updateResult),
    })

    return {
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
      _mockUpdate: mockUpdate,
    } as unknown as SupabaseClient & { _mockUpdate: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('updateRent', () => {
    it('has correct description for AI tool calling', () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      expect(tools.updateRent.description).toContain('rent')
      expect(tools.updateRent.description).toContain('monthly')
    })

    it('validates amount with Zod schema - rejects negative numbers', async () => {
      const result = rentSchema.safeParse({ amount: -100 })

      expect(result.success).toBe(false)
    })

    it('validates amount with Zod schema - accepts zero (work from home, own building)', () => {
      const result = rentSchema.safeParse({ amount: 0 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(0)
    })

    it('validates amount with Zod schema - accepts positive numbers', () => {
      const result = rentSchema.safeParse({ amount: 3500 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(3500)
    })

    it('updates monthly_rent in profiles table on execute', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      await tools.updateRent.execute({ amount: 3500 }, {} as never)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase._mockUpdate).toHaveBeenCalledWith({ monthly_rent: 3500 })
    })

    it('returns success message with formatted amount', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      const result = await tools.updateRent.execute({ amount: 3500 }, {} as never)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Got it, I've updated your monthly rent to $3,500")
    })

    it('returns failure message when database error occurs', async () => {
      const errorSupabase = createMockSupabase({ error: new Error('Connection failed') })
      const tools = createProfileTools(errorSupabase, mockUserId)

      const result = await tools.updateRent.execute({ amount: 3500 }, {} as never)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to update rent')
    })
  })

  describe('updateEmployeeCount', () => {
    it('has correct description for AI tool calling', () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      expect(tools.updateEmployeeCount.description).toContain('employee')
      expect(tools.updateEmployeeCount.description).toContain('headcount')
    })

    it('validates count with Zod schema - rejects non-integers', () => {
      const result = employeeCountSchema.safeParse({ count: 8.5 })

      expect(result.success).toBe(false)
    })

    it('validates count with Zod schema - rejects zero', () => {
      const result = employeeCountSchema.safeParse({ count: 0 })

      expect(result.success).toBe(false)
    })

    it('validates count with Zod schema - accepts positive integers', () => {
      const result = employeeCountSchema.safeParse({ count: 8 })

      expect(result.success).toBe(true)
      expect(result.data?.count).toBe(8)
    })

    it('updates employee_count in profiles table on execute', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      await tools.updateEmployeeCount.execute({ count: 8 }, {} as never)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase._mockUpdate).toHaveBeenCalledWith({ employee_count: 8 })
    })

    it('returns success message with count', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      const result = await tools.updateEmployeeCount.execute({ count: 8 }, {} as never)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Got it, I've updated your employee count to 8")
    })

    it('returns failure message when database error occurs', async () => {
      const errorSupabase = createMockSupabase({ error: new Error('Connection failed') })
      const tools = createProfileTools(errorSupabase, mockUserId)

      const result = await tools.updateEmployeeCount.execute({ count: 8 }, {} as never)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to update employee count')
    })
  })

  describe('updateMonthlyOverhead', () => {
    it('has correct description for AI tool calling', () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      expect(tools.updateMonthlyOverhead.description).toContain('overhead')
      expect(tools.updateMonthlyOverhead.description).toContain('monthly')
    })

    it('validates amount with Zod schema - rejects negative numbers', () => {
      const result = overheadSchema.safeParse({ amount: -500 })

      expect(result.success).toBe(false)
    })

    it('validates amount with Zod schema - accepts zero', () => {
      const result = overheadSchema.safeParse({ amount: 0 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(0)
    })

    it('validates amount with Zod schema - accepts positive numbers', () => {
      const result = overheadSchema.safeParse({ amount: 15000 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(15000)
    })

    it('updates monthly_overhead_estimate in profiles table on execute', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      await tools.updateMonthlyOverhead.execute({ amount: 15000 }, {} as never)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase._mockUpdate).toHaveBeenCalledWith({ monthly_overhead_estimate: 15000 })
    })

    it('returns success message with formatted amount', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      const result = await tools.updateMonthlyOverhead.execute({ amount: 15000 }, {} as never)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Got it, I've updated your monthly overhead estimate to $15,000")
    })

    it('returns failure message when database error occurs', async () => {
      const errorSupabase = createMockSupabase({ error: new Error('Connection failed') })
      const tools = createProfileTools(errorSupabase, mockUserId)

      const result = await tools.updateMonthlyOverhead.execute({ amount: 15000 }, {} as never)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to update overhead estimate')
    })
  })

  describe('updateSoftwareSpend', () => {
    it('has correct description for AI tool calling', () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      expect(tools.updateSoftwareSpend.description).toContain('software')
      expect(tools.updateSoftwareSpend.description).toContain('SaaS')
    })

    it('validates amount with Zod schema - rejects negative numbers', () => {
      const result = softwareSpendSchema.safeParse({ amount: -200 })

      expect(result.success).toBe(false)
    })

    it('validates amount with Zod schema - accepts zero (no software costs)', () => {
      const result = softwareSpendSchema.safeParse({ amount: 0 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(0)
    })

    it('validates amount with Zod schema - accepts positive numbers', () => {
      const result = softwareSpendSchema.safeParse({ amount: 2000 })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(2000)
    })

    it('updates monthly_software_spend in profiles table on execute', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      await tools.updateSoftwareSpend.execute({ amount: 2000 }, {} as never)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase._mockUpdate).toHaveBeenCalledWith({ monthly_software_spend: 2000 })
    })

    it('returns success message with formatted amount', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      const result = await tools.updateSoftwareSpend.execute({ amount: 2000 }, {} as never)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Got it, I've updated your monthly software spend to $2,000")
    })

    it('returns failure message when database error occurs', async () => {
      const errorSupabase = createMockSupabase({ error: new Error('Connection failed') })
      const tools = createProfileTools(errorSupabase, mockUserId)

      const result = await tools.updateSoftwareSpend.execute({ amount: 2000 }, {} as never)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to update software spend')
    })
  })

  describe('tool result shape', () => {
    it('all tools return ProfileToolResult with success and message', async () => {
      const tools = createProfileTools(mockSupabase, mockUserId)

      const rentResult = await tools.updateRent.execute({ amount: 1000 }, {} as never)
      const countResult = await tools.updateEmployeeCount.execute({ count: 5 }, {} as never)
      const overheadResult = await tools.updateMonthlyOverhead.execute({ amount: 5000 }, {} as never)
      const softwareResult = await tools.updateSoftwareSpend.execute({ amount: 500 }, {} as never)

      for (const result of [rentResult, countResult, overheadResult, softwareResult]) {
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('message')
        expect(typeof result.success).toBe('boolean')
        expect(typeof result.message).toBe('string')
      }
    })
  })
})
