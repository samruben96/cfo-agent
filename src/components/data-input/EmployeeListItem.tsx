'use client'

import { Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format-currency'

import type { Employee, EmploymentType } from '@/types/employees'

interface EmployeeListItemProps {
  employee: Employee
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
  className?: string
}

/**
 * Get display label for employment type
 */
function getEmploymentTypeLabel(type: EmploymentType): string {
  switch (type) {
    case 'full-time':
      return 'Full-time'
    case 'part-time':
      return 'Part-time'
    case 'contractor':
      return 'Contractor'
    default:
      return type
  }
}

export function EmployeeListItem({
  employee,
  onEdit,
  onDelete,
  className,
}: EmployeeListItemProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        {/* Employee Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">
              {employee.name}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {getEmploymentTypeLabel(employee.employmentType)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>{employee.role}</span>
            {employee.department && (
              <>
                <span className="mx-1">•</span>
                <span>{employee.department}</span>
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-sm">
            <div>
              <span className="text-muted-foreground">Salary: </span>
              <span className="font-medium">
                {formatCurrency(employee.annualSalary)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Benefits: </span>
              <span className="font-medium">
                {formatCurrency(employee.annualBenefits)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(employee)}
            aria-label="Edit employee"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(employee.id)}
            aria-label="Delete employee"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
