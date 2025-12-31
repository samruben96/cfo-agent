'use client'

import { useState, useMemo } from 'react'

import { CheckCircle, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { getCSVTypeLabel } from '@/lib/documents/csv-type-detector'
import { getTargetFieldsForCSVType } from '@/types/documents'

import type { CSVType } from '@/types/documents'

interface CSVMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  headers: string[]
  csvType: CSVType
  onConfirm: (mappings: Record<string, string>) => void
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

// Required fields per CSV type
const REQUIRED_MAPPINGS: Record<CSVType, string[]> = {
  pl: ['description', 'expense_amount'],
  payroll: ['employee_name', 'gross_pay'],
  employees: ['name', 'role'],
  unknown: []
}

// Human-readable labels for target fields
const FIELD_LABELS: Record<string, string> = {
  // P&L fields
  revenue: 'Revenue',
  expense_category: 'Expense Category',
  expense_amount: 'Expense Amount',
  date: 'Date',
  description: 'Description',
  transaction_type: 'Transaction Type (Income/Expense)',
  // Payroll fields
  employee_name: 'Employee Name',
  employee_id: 'Employee ID',
  hours_worked: 'Hours Worked',
  hourly_rate: 'Hourly Rate',
  gross_pay: 'Gross Pay',
  net_pay: 'Net Pay',
  pay_date: 'Pay Date',
  // Employee fields
  name: 'Name',
  role: 'Role',
  department: 'Department',
  annual_salary: 'Annual Salary',
  annual_benefits: 'Annual Benefits',
  employment_type: 'Employment Type',
  // Common
  ignore: 'Ignore Column'
}

/**
 * Synonym mappings for common CSV column names.
 * Maps common variations to their target field names.
 */
const COLUMN_SYNONYMS: Record<string, Record<string, string[]>> = {
  pl: {
    revenue: ['revenue', 'income', 'sales', 'total_income', 'total_revenue'],
    expense_category: ['category', 'expense_category', 'account', 'account_name', 'type', 'expense_type', 'cost_center'],
    expense_amount: ['amount', 'expense_amount', 'value', 'total', 'cost', 'expense', 'debit', 'credit'],
    date: ['date', 'transaction_date', 'period', 'month', 'year', 'posting_date'],
    description: ['description', 'memo', 'notes', 'details', 'line_item', 'item', 'name'],
    transaction_type: ['type', 'transaction_type', 'entry_type', 'income_expense', 'dr_cr']
  },
  payroll: {
    employee_name: ['name', 'employee_name', 'employee', 'full_name', 'staff_name', 'worker'],
    employee_id: ['id', 'employee_id', 'emp_id', 'staff_id', 'employee_number', 'emp_no'],
    hours_worked: ['hours', 'hours_worked', 'total_hours', 'work_hours', 'regular_hours'],
    hourly_rate: ['rate', 'hourly_rate', 'pay_rate', 'hour_rate'],
    gross_pay: ['gross', 'gross_pay', 'gross_wages', 'gross_earnings', 'total_pay', 'total_earnings'],
    net_pay: ['net', 'net_pay', 'net_wages', 'take_home', 'net_earnings'],
    pay_date: ['date', 'pay_date', 'payment_date', 'check_date', 'period_end']
  },
  employees: {
    name: ['name', 'full_name', 'employee_name', 'employee', 'staff_name', 'first_last'],
    employee_id: ['id', 'employee_id', 'emp_id', 'staff_id', 'employee_number'],
    role: ['role', 'title', 'job_title', 'position', 'job', 'designation'],
    department: ['department', 'dept', 'team', 'division', 'group', 'unit'],
    annual_salary: ['salary', 'annual_salary', 'yearly_salary', 'base_salary', 'compensation'],
    annual_benefits: ['benefits', 'annual_benefits', 'total_benefits', 'benefit_cost'],
    employment_type: ['type', 'employment_type', 'emp_type', 'status', 'full_part_time', 'ft_pt']
  },
  unknown: {}
}

/**
 * Auto-detect mappings based on header names using synonym matching.
 */
function autoDetectMappings(
  headers: string[],
  csvType: CSVType
): Record<string, string> {
  const mappings: Record<string, string> = {}
  const targetFields = getTargetFieldsForCSVType(csvType)
  const synonyms = COLUMN_SYNONYMS[csvType] || {}
  const usedTargets = new Set<string>()

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, '_')

    // Try exact match first
    if (targetFields.includes(normalizedHeader)) {
      mappings[header] = normalizedHeader
      usedTargets.add(normalizedHeader)
      continue
    }

    // Try synonym match
    let matched = false
    for (const [targetField, synonymList] of Object.entries(synonyms)) {
      if (usedTargets.has(targetField)) continue // Don't double-map

      for (const synonym of synonymList) {
        const normalizedSynonym = synonym.replace(/[_\s-]+/g, '_')
        if (
          normalizedHeader === normalizedSynonym ||
          normalizedHeader.includes(normalizedSynonym) ||
          normalizedSynonym.includes(normalizedHeader)
        ) {
          mappings[header] = targetField
          usedTargets.add(targetField)
          matched = true
          break
        }
      }
      if (matched) break
    }

    // If no match, default to ignore
    if (!mappings[header]) {
      mappings[header] = 'ignore'
    }
  }

  return mappings
}

export function CSVMappingDialog({
  open,
  onOpenChange,
  headers,
  csvType,
  onConfirm,
  onCancel,
  isLoading = false,
  className
}: CSVMappingDialogProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() =>
    autoDetectMappings(headers, csvType)
  )

  const targetFields = useMemo(() => getTargetFieldsForCSVType(csvType), [csvType])
  const requiredFields = REQUIRED_MAPPINGS[csvType]
  const typeLabel = getCSVTypeLabel(csvType)

  // Check if all required mappings are set
  const missingRequired = useMemo(() => {
    const mappedTargets = new Set(Object.values(mappings))
    return requiredFields.filter((field) => !mappedTargets.has(field))
  }, [mappings, requiredFields])

  const isValid = missingRequired.length === 0

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings((prev) => ({
      ...prev,
      [sourceColumn]: targetField
    }))
  }

  const handleConfirm = () => {
    // Filter out 'ignore' mappings before confirming
    const finalMappings = Object.fromEntries(
      Object.entries(mappings).filter(([, target]) => target !== 'ignore')
    )
    onConfirm(finalMappings)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
          <DialogDescription>
            Configure how columns from your CSV map to {typeLabel} fields.
            Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {/* Status summary */}
          {isValid ? (
            <div className="mb-4 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              All required fields mapped. Ready to import!
            </div>
          ) : (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Missing required mappings: {missingRequired.map((f) => FIELD_LABELS[f] || f).join(', ')}
            </div>
          )}

          <div className="space-y-3">
            {headers.map((header) => {
              const currentMapping = mappings[header] || 'ignore'
              const isMappedToRequired = requiredFields.includes(currentMapping)
              const isIgnored = currentMapping === 'ignore'

              return (
                <div
                  key={header}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-md transition-colors',
                    isMappedToRequired && 'bg-green-500/5',
                    isIgnored && 'opacity-60'
                  )}
                >
                  <div className="w-1/3 flex items-center gap-2">
                    {isMappedToRequired && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    <Label className="text-sm font-medium truncate">{header}</Label>
                  </div>
                  <div className="w-8 text-center">
                    <span className="text-muted-foreground">→</span>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={currentMapping}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger className={cn(
                        'w-full',
                        isMappedToRequired && 'border-green-500/50'
                      )}>
                        <SelectValue placeholder="Select mapping" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {FIELD_LABELS[field] || field}
                            {requiredFields.includes(field) ? ' *' : ''}
                          </SelectItem>
                        ))}
                        <SelectItem value="ignore">
                          {FIELD_LABELS['ignore']}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isLoading}>
            {isLoading ? 'Importing...' : 'Confirm Mappings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
