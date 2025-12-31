'use client'

import { useState, useMemo } from 'react'

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
 * Auto-detect mappings based on header names.
 */
function autoDetectMappings(
  headers: string[],
  csvType: CSVType
): Record<string, string> {
  const mappings: Record<string, string> = {}
  const targetFields = getTargetFieldsForCSVType(csvType)

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, '_')

    // Try exact match first
    if (targetFields.includes(normalizedHeader)) {
      mappings[header] = normalizedHeader
      continue
    }

    // Try fuzzy match
    for (const field of targetFields) {
      const normalizedField = field.replace(/_/g, '')
      if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader.replace(/_/g, ''))) {
        mappings[header] = field
        break
      }
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
          <div className="space-y-4">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <div className="w-1/3">
                  <Label className="text-sm font-medium">{header}</Label>
                </div>
                <div className="w-1/3">
                  <span className="text-muted-foreground">→</span>
                </div>
                <div className="w-1/3">
                  <Select
                    value={mappings[header] || 'ignore'}
                    onValueChange={(value) => handleMappingChange(header, value)}
                  >
                    <SelectTrigger className="w-full">
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
            ))}
          </div>

          {/* Validation message */}
          {missingRequired.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              Missing required mappings: {missingRequired.map((f) => FIELD_LABELS[f] || f).join(', ')}
            </div>
          )}
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
