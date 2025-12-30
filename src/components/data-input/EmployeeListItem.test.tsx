/**
 * Unit tests for EmployeeListItem component
 * Story: 3-2-employee-headcount-intake-form
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { EmployeeListItem } from './EmployeeListItem'

import type { Employee } from '@/types/employees'

describe('EmployeeListItem', () => {
  const mockEmployee: Employee = {
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
  }

  it('renders employee name, role, and department', () => {
    render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Producer')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
  })

  it('renders employee salary and benefits', () => {
    render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('$65,000')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument()
  })

  it('renders employment type badge', () => {
    render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('Full-time')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    )

    const editButton = screen.getByLabelText('Edit employee')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockEmployee)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    )

    const deleteButton = screen.getByLabelText('Delete employee')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockEmployee.id)
  })

  it('handles employee without department', () => {
    const employeeNoDept: Employee = {
      ...mockEmployee,
      department: undefined,
    }

    render(
      <EmployeeListItem
        employee={employeeNoDept}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <EmployeeListItem
        employee={mockEmployee}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
