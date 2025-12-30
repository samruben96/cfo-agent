'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type {
  EmployeeFormData,
  EmploymentType,
} from '@/types/employees'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/types/employees'

interface FormErrors {
  name?: string
  role?: string
  annualSalary?: string
}

interface EmployeeFormProps {
  formData: EmployeeFormData
  onChange: (data: Partial<EmployeeFormData>) => void
  onSubmit: () => void
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
  className?: string
}

/**
 * Validates employee form data
 */
function validateForm(data: EmployeeFormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!data.role.trim()) {
    errors.role = 'Role is required'
  }

  if (data.annualSalary === null || data.annualSalary < 0) {
    errors.annualSalary = 'Valid salary is required'
  }

  return errors
}

export function EmployeeForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Employee',
  className,
}: EmployeeFormProps) {
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
    >
      {/* Name - Required */}
      <div className="space-y-2">
        <Label htmlFor="employee-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="employee-name"
          placeholder="Employee name"
          value={formData.name}
          onChange={(e) => {
            onChange({ name: e.target.value })
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
          }}
          disabled={isLoading}
          aria-describedby={errors.name ? 'employee-name-error' : undefined}
          aria-invalid={!!errors.name}
          required
        />
        {errors.name && (
          <p id="employee-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Employee ID - Optional */}
      <div className="space-y-2">
        <Label htmlFor="employee-id">Employee ID</Label>
        <Input
          id="employee-id"
          placeholder="e.g., EMP001 (optional)"
          value={formData.employeeId || ''}
          onChange={(e) => onChange({ employeeId: e.target.value })}
          disabled={isLoading}
        />
      </div>

      {/* Role - Required */}
      <div className="space-y-2">
        <Label htmlFor="employee-role">
          Role <span className="text-destructive">*</span>
        </Label>
        <Input
          id="employee-role"
          placeholder="e.g., Producer, CSR, Account Manager"
          value={formData.role}
          onChange={(e) => {
            onChange({ role: e.target.value })
            if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }))
          }}
          disabled={isLoading}
          aria-describedby={errors.role ? 'employee-role-error' : undefined}
          aria-invalid={!!errors.role}
          required
        />
        {errors.role && (
          <p id="employee-role-error" className="text-sm text-destructive">
            {errors.role}
          </p>
        )}
      </div>

      {/* Department - Optional */}
      <div className="space-y-2">
        <Label htmlFor="employee-department">Department</Label>
        <Input
          id="employee-department"
          placeholder="e.g., Sales, Service, Operations (optional)"
          value={formData.department || ''}
          onChange={(e) => onChange({ department: e.target.value })}
          disabled={isLoading}
        />
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <Label htmlFor="employment-type">Employment Type</Label>
        <Select
          value={formData.employmentType}
          onValueChange={(value: EmploymentType) =>
            onChange({ employmentType: value })
          }
          disabled={isLoading}
        >
          <SelectTrigger id="employment-type">
            <SelectValue placeholder="Select employment type" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Salary - Required */}
      <div className="space-y-2">
        <Label htmlFor="annual-salary">
          Annual Salary <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="annual-salary"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={formData.annualSalary ?? ''}
            onChange={(e) => {
              onChange({
                annualSalary:
                  e.target.value === '' ? null : parseFloat(e.target.value),
              })
              if (errors.annualSalary) setErrors((prev) => ({ ...prev, annualSalary: undefined }))
            }}
            disabled={isLoading}
            className="pl-7"
            aria-describedby={errors.annualSalary ? 'annual-salary-error' : undefined}
            aria-invalid={!!errors.annualSalary}
            required
          />
        </div>
        {errors.annualSalary && (
          <p id="annual-salary-error" className="text-sm text-destructive">
            {errors.annualSalary}
          </p>
        )}
      </div>

      {/* Benefits - Optional */}
      <div className="space-y-2">
        <Label htmlFor="annual-benefits">Annual Benefits</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="annual-benefits"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={formData.annualBenefits ?? ''}
            onChange={(e) =>
              onChange({
                annualBenefits:
                  e.target.value === '' ? null : parseFloat(e.target.value),
              })
            }
            disabled={isLoading}
            className="pl-7"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Health insurance, 401k match, etc.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
