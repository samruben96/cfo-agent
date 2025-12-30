'use server'

import { createClient } from '@/lib/supabase/server'

import type { ActionResponse } from '@/types'
import type {
  Employee,
  EmployeeFormData,
  EmployeeRow,
  EmploymentType,
} from '@/types/employees'

/**
 * Valid employment type values.
 */
const VALID_EMPLOYMENT_TYPES: EmploymentType[] = ['full-time', 'part-time', 'contractor']

/**
 * Type guard to validate employment type from database.
 */
function isValidEmploymentType(value: string): value is EmploymentType {
  return VALID_EMPLOYMENT_TYPES.includes(value as EmploymentType)
}

/**
 * Transforms a database row to the application-level Employee model.
 */
function transformRowToEmployee(row: EmployeeRow): Employee {
  // Validate employment type with fallback to 'full-time'
  const employmentType = isValidEmploymentType(row.employment_type)
    ? row.employment_type
    : 'full-time'

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    employeeId: row.employee_id ?? undefined,
    role: row.role,
    department: row.department ?? undefined,
    employmentType,
    annualSalary: row.annual_salary,
    annualBenefits: row.annual_benefits ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Fetches all employees for the current user.
 * Returns an empty array if no employees exist.
 */
export async function getEmployees(): Promise<ActionResponse<Employee[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[EmployeesService]', {
        action: 'getEmployees',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('[EmployeesService]', {
        action: 'getEmployees',
        error: error.message,
      })
      return { data: null, error: 'Failed to load employees' }
    }

    const transformed = (data as EmployeeRow[]).map(transformRowToEmployee)
    console.log('[EmployeesService]', {
      action: 'getEmployees',
      userId: user.id,
      count: transformed.length,
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[EmployeesService]', {
      action: 'getEmployees',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to load employees' }
  }
}

/**
 * Adds a new employee for the current user.
 */
export async function addEmployee(
  formData: EmployeeFormData
): Promise<ActionResponse<Employee>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[EmployeesService]', {
        action: 'addEmployee',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    // Transform from camelCase TS to snake_case DB
    const dbData = {
      user_id: user.id,
      name: formData.name.trim(),
      employee_id: formData.employeeId?.trim() || null,
      role: formData.role.trim(),
      department: formData.department?.trim() || null,
      employment_type: formData.employmentType,
      annual_salary: formData.annualSalary ?? 0,
      annual_benefits: formData.annualBenefits ?? 0,
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(dbData)
      .select()
      .single()

    if (error) {
      console.error('[EmployeesService]', {
        action: 'addEmployee',
        error: error.message,
      })
      return { data: null, error: 'Failed to add employee' }
    }

    const transformed = transformRowToEmployee(data as EmployeeRow)
    console.log('[EmployeesService]', {
      action: 'addEmployee',
      userId: user.id,
      employeeId: transformed.id,
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[EmployeesService]', {
      action: 'addEmployee',
      error: e instanceof Error ? e.message : 'Unknown error',
    })
    return { data: null, error: 'Failed to add employee' }
  }
}

/**
 * Updates an existing employee.
 */
export async function updateEmployee(
  employeeId: string,
  formData: EmployeeFormData
): Promise<ActionResponse<Employee>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[EmployeesService]', {
        action: 'updateEmployee',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    const dbData = {
      name: formData.name.trim(),
      employee_id: formData.employeeId?.trim() || null,
      role: formData.role.trim(),
      department: formData.department?.trim() || null,
      employment_type: formData.employmentType,
      annual_salary: formData.annualSalary ?? 0,
      annual_benefits: formData.annualBenefits ?? 0,
    }

    const { data, error } = await supabase
      .from('employees')
      .update(dbData)
      .eq('id', employeeId)
      .eq('user_id', user.id) // RLS double-check
      .select()
      .single()

    if (error) {
      console.error('[EmployeesService]', {
        action: 'updateEmployee',
        error: error.message,
        employeeId,
      })
      return { data: null, error: 'Failed to update employee' }
    }

    const transformed = transformRowToEmployee(data as EmployeeRow)
    console.log('[EmployeesService]', {
      action: 'updateEmployee',
      userId: user.id,
      employeeId,
    })
    return { data: transformed, error: null }
  } catch (e) {
    console.error('[EmployeesService]', {
      action: 'updateEmployee',
      error: e instanceof Error ? e.message : 'Unknown error',
      employeeId,
    })
    return { data: null, error: 'Failed to update employee' }
  }
}

/**
 * Deletes an employee by ID.
 */
export async function deleteEmployee(
  employeeId: string
): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[EmployeesService]', {
        action: 'deleteEmployee',
        error: 'Not authenticated',
      })
      return { data: null, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('user_id', user.id) // RLS double-check

    if (error) {
      console.error('[EmployeesService]', {
        action: 'deleteEmployee',
        error: error.message,
        employeeId,
      })
      return { data: null, error: 'Failed to delete employee' }
    }

    console.log('[EmployeesService]', {
      action: 'deleteEmployee',
      userId: user.id,
      employeeId,
    })
    return { data: { deleted: true }, error: null }
  } catch (e) {
    console.error('[EmployeesService]', {
      action: 'deleteEmployee',
      error: e instanceof Error ? e.message : 'Unknown error',
      employeeId,
    })
    return { data: null, error: 'Failed to delete employee' }
  }
}
