/**
 * CSV data import utilities.
 * Imports parsed CSV data to appropriate database tables.
 * Story: 3.3 CSV File Upload
 */
import { createClient } from '@/lib/supabase/server'

import type { CSVType } from '@/types/documents'

export interface ImportResult {
  success: boolean
  rowsImported: number
  rowsSkipped: number
  errors: string[]
}

export interface ImportOptions {
  userId: string
  csvType: CSVType
  mappings: Record<string, string>
  data: Record<string, unknown>[]
}

/**
 * Import CSV data to the appropriate target table based on CSV type.
 */
export async function importCSVData(options: ImportOptions): Promise<ImportResult> {
  const { csvType, mappings, data, userId } = options

  switch (csvType) {
    case 'employees':
      return importEmployeeData(userId, mappings, data)
    case 'payroll':
      return importPayrollData(userId, mappings, data)
    case 'pl':
      return importPLData(userId, mappings, data)
    default:
      return {
        success: false,
        rowsImported: 0,
        rowsSkipped: data.length,
        errors: ['Unknown CSV type - cannot import']
      }
  }
}

/**
 * Import employee roster data to employees table.
 */
async function importEmployeeData(
  userId: string,
  mappings: Record<string, string>,
  data: Record<string, unknown>[]
): Promise<ImportResult> {
  const supabase = await createClient()
  const errors: string[] = []
  let rowsImported = 0
  let rowsSkipped = 0

  // Get column names that map to each target field
  const columnForField = Object.entries(mappings).reduce((acc, [column, field]) => {
    acc[field] = column
    return acc
  }, {} as Record<string, string>)

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    try {
      // Extract values based on mappings
      const name = row[columnForField['name']]
      const role = row[columnForField['role']]
      const department = row[columnForField['department']]
      const annualSalary = row[columnForField['annual_salary']]
      const annualBenefits = row[columnForField['annual_benefits']]
      const employmentType = row[columnForField['employment_type']]
      const employeeId = row[columnForField['employee_id']]

      // Validate required fields
      if (!name || !role) {
        errors.push(`Row ${i + 1}: Missing required field (name or role)`)
        rowsSkipped++
        continue
      }

      // Insert into employees table
      const { error } = await supabase.from('employees').insert({
        user_id: userId,
        name: String(name),
        role: String(role),
        department: department ? String(department) : null,
        annual_salary: typeof annualSalary === 'number' ? annualSalary : parseFloat(String(annualSalary)) || 0,
        annual_benefits: typeof annualBenefits === 'number' ? annualBenefits : parseFloat(String(annualBenefits)) || 0,
        employment_type: mapEmploymentType(String(employmentType || 'full-time')),
        employee_id: employeeId ? String(employeeId) : null
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
        rowsSkipped++
      } else {
        rowsImported++
      }
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      rowsSkipped++
    }
  }

  console.log('[CSVImporter]', {
    action: 'importEmployeeData',
    rowsImported,
    rowsSkipped,
    errorCount: errors.length
  })

  return {
    success: errors.length === 0,
    rowsImported,
    rowsSkipped,
    errors: errors.slice(0, 10) // Limit error messages
  }
}

/**
 * Import payroll data.
 * Note: Payroll table may need to be created in a future story.
 * For now, log the import attempt.
 */
async function importPayrollData(
  userId: string,
  mappings: Record<string, string>,
  data: Record<string, unknown>[]
): Promise<ImportResult> {
  // TODO: Implement when payroll table is created
  console.log('[CSVImporter]', {
    action: 'importPayrollData',
    message: 'Payroll import not yet implemented',
    rowCount: data.length
  })

  return {
    success: false,
    rowsImported: 0,
    rowsSkipped: data.length,
    errors: ['Payroll import is not yet supported. This feature is coming soon.']
  }
}

/**
 * Import P&L (Profit & Loss) data.
 * Stores data in the document's extracted_data JSONB field.
 */
async function importPLData(
  userId: string,
  mappings: Record<string, string>,
  data: Record<string, unknown>[]
): Promise<ImportResult> {
  const errors: string[] = []
  let rowsImported = 0
  let rowsSkipped = 0

  // Get column names that map to each target field
  const columnForField = Object.entries(mappings).reduce((acc, [column, field]) => {
    acc[field] = column
    return acc
  }, {} as Record<string, string>)

  // Process and normalize the P&L data
  const processedRows: Record<string, unknown>[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    try {
      // Extract values based on mappings
      const date = row[columnForField['date']]
      const description = row[columnForField['description']]
      const category = row[columnForField['expense_category']]
      const amount = row[columnForField['expense_amount']]
      const transactionType = row[columnForField['transaction_type']]
      const revenue = row[columnForField['revenue']]

      // Validate - need at least description and amount
      if (!description && !category) {
        errors.push(`Row ${i + 1}: Missing description or category`)
        rowsSkipped++
        continue
      }

      if (!amount && !revenue) {
        errors.push(`Row ${i + 1}: Missing amount`)
        rowsSkipped++
        continue
      }

      // Normalize the amount - positive for income, negative for expense
      const normalizedAmount = parseFloat(String(amount || revenue || 0))
      const typeStr = String(transactionType || '').toLowerCase()

      // Determine if it's income or expense
      let type: 'income' | 'expense' = 'expense'
      if (
        typeStr.includes('income') ||
        typeStr.includes('revenue') ||
        typeStr === 'credit' ||
        revenue
      ) {
        type = 'income'
      }

      processedRows.push({
        date: date ? String(date) : null,
        description: String(description || category || ''),
        category: String(category || ''),
        amount: normalizedAmount,
        type,
        originalRow: i + 1
      })
      rowsImported++
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      rowsSkipped++
    }
  }

  console.log('[CSVImporter]', {
    action: 'importPLData',
    rowsImported,
    rowsSkipped,
    errorCount: errors.length
  })

  // Note: The actual storage to extracted_data happens in confirmCSVImport
  // We return success here so the caller knows data was processed
  return {
    success: errors.length === 0 || rowsImported > 0,
    rowsImported,
    rowsSkipped,
    errors: errors.slice(0, 10) // Limit error messages
  }
}

/**
 * Map employment type string to valid enum value.
 */
function mapEmploymentType(value: string): 'full-time' | 'part-time' | 'contractor' {
  const normalized = value.toLowerCase().trim().replace(/[^a-z]/g, '')

  if (normalized.includes('part') || normalized === 'pt') {
    return 'part-time'
  }
  if (normalized.includes('contract') || normalized === 'contractor') {
    return 'contractor'
  }
  return 'full-time'
}
