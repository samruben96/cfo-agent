/**
 * Unit tests for employees server actions
 * Story: 3-2-employee-headcount-intake-form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { EmployeeFormData } from '@/types/employees'

// Mock the Supabase client
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
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
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from './employees'

// Mock for second eq() call in update/delete operations
const mockSecondEq = vi.fn()

describe('employees actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default chain for various operations
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder, eq: mockSecondEq, single: mockSingle })
    mockOrder.mockReturnValue({ data: [], error: null })
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) })
    // Update chain: update().eq(id).eq(user_id).select().single()
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockSecondEq.mockReturnValue({
      select: vi.fn().mockReturnValue({ single: mockSingle }),
      // For delete, we need the final .eq() to be a promise
    })
    // Delete chain: delete().eq(id).eq(user_id) - returns promise directly
    mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: mockSecondEq }) })
  })

  describe('getEmployees', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await getEmployees()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('returns empty array when no employees exist', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getEmployees()

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('returns transformed employees when data exists', async () => {
      const mockRows = [
        {
          id: 'emp-123',
          user_id: 'user-123',
          name: 'John Doe',
          employee_id: 'EMP001',
          role: 'Producer',
          department: 'Sales',
          employment_type: 'full-time',
          annual_salary: 65000,
          annual_benefits: 15000,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'emp-456',
          user_id: 'user-123',
          name: 'Jane Smith',
          employee_id: null,
          role: 'CSR',
          department: null,
          employment_type: 'part-time',
          annual_salary: 35000,
          annual_benefits: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockOrder.mockResolvedValue({
        data: mockRows,
        error: null,
      })

      const result = await getEmployees()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        id: 'emp-123',
        userId: 'user-123',
        name: 'John Doe',
        employeeId: 'EMP001',
        role: 'Producer',
        department: 'Sales',
        employmentType: 'full-time',
        annualSalary: 65000,
        annualBenefits: 15000,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      })
      expect(result.data?.[1].employeeId).toBeUndefined()
      expect(result.data?.[1].department).toBeUndefined()
      expect(result.data?.[1].annualBenefits).toBe(0)
    })

    it('returns error for database failures', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getEmployees()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to load employees')
    })
  })

  describe('addEmployee', () => {
    const validFormData: EmployeeFormData = {
      name: 'John Doe',
      employeeId: 'EMP001',
      role: 'Producer',
      department: 'Sales',
      employmentType: 'full-time',
      annualSalary: 65000,
      annualBenefits: 15000,
    }

    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await addEmployee(validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('adds employee and returns transformed data', async () => {
      const savedRow = {
        id: 'emp-123',
        user_id: 'user-123',
        name: 'John Doe',
        employee_id: 'EMP001',
        role: 'Producer',
        department: 'Sales',
        employment_type: 'full-time',
        annual_salary: 65000,
        annual_benefits: 15000,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: savedRow,
        error: null,
      })

      const result = await addEmployee(validFormData)

      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        id: 'emp-123',
        userId: 'user-123',
        name: 'John Doe',
        employeeId: 'EMP001',
        role: 'Producer',
        department: 'Sales',
        employmentType: 'full-time',
        annualSalary: 65000,
        annualBenefits: 15000,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      })
    })

    it('handles null form values correctly', async () => {
      const formDataWithNulls: EmployeeFormData = {
        name: 'John Doe',
        employeeId: '',
        role: 'CSR',
        department: '',
        employmentType: 'part-time',
        annualSalary: null,
        annualBenefits: null,
      }

      const savedRow = {
        id: 'emp-123',
        user_id: 'user-123',
        name: 'John Doe',
        employee_id: null,
        role: 'CSR',
        department: null,
        employment_type: 'part-time',
        annual_salary: 0,
        annual_benefits: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: savedRow,
        error: null,
      })

      const result = await addEmployee(formDataWithNulls)

      expect(result.error).toBeNull()
      expect(result.data?.annualSalary).toBe(0)
      expect(result.data?.annualBenefits).toBe(0)
      expect(result.data?.employeeId).toBeUndefined()
      expect(result.data?.department).toBeUndefined()
    })

    it('returns error for database failures', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await addEmployee(validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to add employee')
    })
  })

  describe('updateEmployee', () => {
    const validFormData: EmployeeFormData = {
      name: 'John Doe Updated',
      employeeId: 'EMP001',
      role: 'Senior Producer',
      department: 'Sales',
      employmentType: 'full-time',
      annualSalary: 75000,
      annualBenefits: 18000,
    }

    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await updateEmployee('emp-123', validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('updates employee and returns transformed data', async () => {
      const updatedRow = {
        id: 'emp-123',
        user_id: 'user-123',
        name: 'John Doe Updated',
        employee_id: 'EMP001',
        role: 'Senior Producer',
        department: 'Sales',
        employment_type: 'full-time',
        annual_salary: 75000,
        annual_benefits: 18000,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      }

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: updatedRow,
        error: null,
      })

      const result = await updateEmployee('emp-123', validFormData)

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('John Doe Updated')
      expect(result.data?.annualSalary).toBe(75000)
    })

    it('returns error for database failures', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await updateEmployee('emp-123', validFormData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to update employee')
    })
  })

  describe('deleteEmployee', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await deleteEmployee('emp-123')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('deletes employee and returns success', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockEq.mockResolvedValue({
        error: null,
      })

      const result = await deleteEmployee('emp-123')

      expect(result.error).toBeNull()
      expect(result.data).toEqual({ deleted: true })
    })

    it('returns error for database failures', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      // Mock the final eq() call in delete chain to return error
      mockSecondEq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await deleteEmployee('emp-123')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to delete employee')
    })
  })
})
