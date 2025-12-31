/**
 * Tests for CSV importer utilities.
 * Story: 3.3 CSV File Upload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { importCSVData } from './csv-importer'

// Mock the Supabase client
const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom
    })
  )
}))

describe('importCSVData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    mockFrom.mockReturnValue({
      insert: mockInsert
    })
    mockInsert.mockResolvedValue({ error: null })
  })

  describe('employees import', () => {
    it('imports employee data successfully', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'employees' as const,
        mappings: {
          'Name': 'name',
          'Job Title': 'role',
          'Salary': 'annual_salary'
        },
        data: [
          { 'Name': 'John Doe', 'Job Title': 'Developer', 'Salary': 80000 },
          { 'Name': 'Jane Smith', 'Job Title': 'Designer', 'Salary': 75000 }
        ]
      }

      const result = await importCSVData(options)

      expect(result.rowsImported).toBe(2)
      expect(result.rowsSkipped).toBe(0)
      expect(result.success).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('employees')
      expect(mockInsert).toHaveBeenCalledTimes(2)
    })

    it('skips rows with missing required fields', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'employees' as const,
        mappings: {
          'Name': 'name',
          'Job Title': 'role'
        },
        data: [
          { 'Name': 'John Doe', 'Job Title': 'Developer' },
          { 'Name': '', 'Job Title': 'Designer' }, // Missing name
          { 'Name': 'Bob', 'Job Title': '' } // Missing role
        ]
      }

      const result = await importCSVData(options)

      expect(result.rowsImported).toBe(1)
      expect(result.rowsSkipped).toBe(2)
      expect(result.errors.length).toBe(2)
    })

    it('handles database errors gracefully', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      mockInsert.mockResolvedValueOnce({ error: { message: 'Duplicate entry' } })

      const options = {
        userId: 'user-123',
        csvType: 'employees' as const,
        mappings: {
          'Name': 'name',
          'Role': 'role'
        },
        data: [
          { 'Name': 'John', 'Role': 'Dev' },
          { 'Name': 'Jane', 'Role': 'Dev' }
        ]
      }

      const result = await importCSVData(options)

      expect(result.rowsImported).toBe(1)
      expect(result.rowsSkipped).toBe(1)
      expect(result.errors).toContain('Row 2: Duplicate entry')
    })

    it('maps employment type correctly', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'employees' as const,
        mappings: {
          'Name': 'name',
          'Role': 'role',
          'Type': 'employment_type'
        },
        data: [
          { 'Name': 'John', 'Role': 'Dev', 'Type': 'Full Time' },
          { 'Name': 'Jane', 'Role': 'Dev', 'Type': 'part-time' },
          { 'Name': 'Bob', 'Role': 'Dev', 'Type': 'Contractor' }
        ]
      }

      await importCSVData(options)

      expect(mockInsert).toHaveBeenCalledTimes(3)

      // Verify employment types were mapped correctly
      const calls = mockInsert.mock.calls
      expect(calls[0][0].employment_type).toBe('full-time')
      expect(calls[1][0].employment_type).toBe('part-time')
      expect(calls[2][0].employment_type).toBe('contractor')
    })
  })

  describe('payroll import', () => {
    it('returns not implemented message for payroll', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'payroll' as const,
        mappings: {},
        data: [{ 'Employee': 'John', 'Hours': 40 }]
      }

      const result = await importCSVData(options)

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('not yet supported')
    })
  })

  describe('P&L import', () => {
    it('returns not implemented message for P&L', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'pl' as const,
        mappings: {},
        data: [{ 'Revenue': 10000 }]
      }

      const result = await importCSVData(options)

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('not yet supported')
    })
  })

  describe('unknown type', () => {
    it('returns error for unknown CSV type', async () => {
      const options = {
        userId: 'user-123',
        csvType: 'unknown' as const,
        mappings: {},
        data: [{ 'A': 1 }]
      }

      const result = await importCSVData(options)

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('Unknown CSV type')
    })
  })
})
