'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { Plus, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmployeeForm } from './EmployeeForm'
import { EmployeeListItem } from './EmployeeListItem'
import { addEmployee, updateEmployee, deleteEmployee } from '@/actions/employees'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format-currency'

import type {
  Employee,
  EmployeeFormData,
  EmployeeSummary,
} from '@/types/employees'
import { EMPTY_EMPLOYEE_FORM } from '@/types/employees'
import type { WindowWithNavHandler } from '@/types/navigation'

interface EmployeeListProps {
  initialEmployees: Employee[]
  className?: string
}

/**
 * Calculate employee summary stats
 */
function calculateSummary(employees: Employee[]): EmployeeSummary {
  const totalHeadcount = employees.length
  const totalAnnualPayroll = employees.reduce(
    (sum, emp) => sum + emp.annualSalary,
    0
  )
  const totalAnnualBenefits = employees.reduce(
    (sum, emp) => sum + emp.annualBenefits,
    0
  )
  const averageSalary =
    totalHeadcount > 0 ? totalAnnualPayroll / totalHeadcount : 0

  return {
    totalHeadcount,
    totalAnnualPayroll,
    totalAnnualBenefits,
    averageSalary,
  }
}

/**
 * Check if employees list has unsaved changes
 */
function hasUnsavedChanges(
  current: Employee[],
  initial: Employee[]
): boolean {
  if (current.length !== initial.length) {
    return true
  }

  for (const emp of current) {
    const initialEmp = initial.find((e) => e.id === emp.id)
    if (!initialEmp) {
      return true
    }
    if (
      emp.name !== initialEmp.name ||
      emp.role !== initialEmp.role ||
      emp.department !== initialEmp.department ||
      emp.annualSalary !== initialEmp.annualSalary ||
      emp.annualBenefits !== initialEmp.annualBenefits ||
      emp.employmentType !== initialEmp.employmentType
    ) {
      return true
    }
  }

  return false
}

export function EmployeeList({
  initialEmployees,
  className,
}: EmployeeListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [savedEmployees, setSavedEmployees] =
    useState<Employee[]>(initialEmployees)

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(EMPTY_EMPLOYEE_FORM)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null)

  // Navigation guard state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  )

  const isDirty = hasUnsavedChanges(employees, savedEmployees)
  const summary = calculateSummary(employees)

  // Handle browser close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleNavigationAttempt = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingNavigation(href)
        setShowLeaveDialog(true)
      } else {
        router.push(href)
      }
    },
    [isDirty, router]
  )

  // Expose navigation handler for external use
  useEffect(() => {
    const windowWithHandler = window as WindowWithNavHandler
    windowWithHandler.__handleSettingsNavigation = handleNavigationAttempt
    return () => {
      delete windowWithHandler.__handleSettingsNavigation
    }
  }, [handleNavigationAttempt])

  // Open add form
  function handleAddClick() {
    setEditingEmployee(null)
    setFormData(EMPTY_EMPLOYEE_FORM)
    setIsFormOpen(true)
  }

  // Open edit form
  function handleEditClick(employee: Employee) {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      employeeId: employee.employeeId,
      role: employee.role,
      department: employee.department,
      employmentType: employee.employmentType,
      annualSalary: employee.annualSalary,
      annualBenefits: employee.annualBenefits,
    })
    setIsFormOpen(true)
  }

  // Handle delete click
  function handleDeleteClick(employeeId: string) {
    setEmployeeToDelete(employeeId)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  function handleConfirmDelete() {
    if (!employeeToDelete) return

    startTransition(async () => {
      const result = await deleteEmployee(employeeToDelete)

      if (result.error) {
        toast.error(result.error)
      } else {
        const updated = employees.filter((e) => e.id !== employeeToDelete)
        setEmployees(updated)
        setSavedEmployees(updated)
        toast.success('Employee removed')
      }

      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    })
  }

  // Handle form change
  function handleFormChange(updates: Partial<EmployeeFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  // Handle form submit
  function handleFormSubmit() {
    startTransition(async () => {
      if (editingEmployee) {
        // Update existing
        const result = await updateEmployee(editingEmployee.id, formData)

        if (result.error) {
          toast.error(result.error)
        } else if (result.data) {
          const updated = employees.map((e) =>
            e.id === editingEmployee.id ? result.data! : e
          )
          setEmployees(updated)
          setSavedEmployees(updated)
          toast.success('Employee updated')
          setIsFormOpen(false)
          setEditingEmployee(null)
        }
      } else {
        // Add new
        const result = await addEmployee(formData)

        if (result.error) {
          toast.error(result.error)
        } else if (result.data) {
          const updated = [...employees, result.data]
          setEmployees(updated)
          setSavedEmployees(updated)
          toast.success('Employee added')
          setIsFormOpen(false)
        }
      }
    })
  }

  // Handle form cancel
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingEmployee(null)
    setFormData(EMPTY_EMPLOYEE_FORM)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      {employees.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Headcount</p>
                <p className="text-2xl font-semibold">
                  {summary.totalHeadcount}
                </p>
                <p className="text-xs text-muted-foreground">employees</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(summary.totalAnnualPayroll)}
                </p>
                <p className="text-xs text-muted-foreground">annual</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Benefits</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(summary.totalAnnualBenefits)}
                </p>
                <p className="text-xs text-muted-foreground">annual</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Salary</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(summary.averageSalary)}
                </p>
                <p className="text-xs text-muted-foreground">per employee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Button */}
      {!isFormOpen && (
        <Button onClick={handleAddClick} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      )}

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeForm
              formData={formData}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isPending}
              submitLabel={editingEmployee ? 'Save Changes' : 'Add Employee'}
            />
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      {employees.length > 0 ? (
        <div className="space-y-3">
          {employees.map((employee) => (
            <EmployeeListItem
              key={employee.id}
              employee={employee}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        !isFormOpen && (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-1">
                No employees yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first employee to start tracking payroll costs.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this employee from your list. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNavigation) {
                  router.push(pendingNavigation)
                }
                setShowLeaveDialog(false)
                setPendingNavigation(null)
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
