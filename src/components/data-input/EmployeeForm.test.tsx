/**
 * Unit tests for EmployeeForm component
 * Story: 3-2-employee-headcount-intake-form
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EmployeeForm } from './EmployeeForm'

import type { EmployeeFormData } from '@/types/employees'

describe('EmployeeForm', () => {
  const defaultFormData: EmployeeFormData = {
    name: '',
    employeeId: '',
    role: '',
    department: '',
    employmentType: 'full-time',
    annualSalary: null,
    annualBenefits: null,
  }

  const filledFormData: EmployeeFormData = {
    name: 'John Doe',
    employeeId: 'EMP001',
    role: 'Producer',
    department: 'Sales',
    employmentType: 'full-time',
    annualSalary: 65000,
    annualBenefits: 15000,
  }

  it('renders all form fields', () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/benefits/i)).toBeInTheDocument()
  })

  it('displays form data values', () => {
    render(
      <EmployeeForm
        formData={filledFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe')
    expect(screen.getByLabelText(/role/i)).toHaveValue('Producer')
    expect(screen.getByLabelText(/department/i)).toHaveValue('Sales')
    expect(screen.getByLabelText(/salary/i)).toHaveValue(65000)
    expect(screen.getByLabelText(/benefits/i)).toHaveValue(15000)
  })

  it('calls onChange when name is changed', async () => {
    const onChange = vi.fn()
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, 'Jane')

    // Should be called for each character
    expect(onChange).toHaveBeenCalled()
  })

  it('calls onChange when role is changed', async () => {
    const onChange = vi.fn()
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const roleInput = screen.getByLabelText(/role/i)
    await userEvent.type(roleInput, 'CSR')

    expect(onChange).toHaveBeenCalled()
  })

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn()
    render(
      <EmployeeForm
        formData={filledFormData}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    )

    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)

    expect(onSubmit).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })

  it('disables submit button when loading', () => {
    render(
      <EmployeeForm
        formData={filledFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading
      />
    )

    const submitButton = screen.getByRole('button', { name: /saving/i })
    expect(submitButton).toBeDisabled()
  })

  it('displays custom submit button text', () => {
    render(
      <EmployeeForm
        formData={filledFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Add Employee"
      />
    )

    expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows required indicator for required fields', () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    // Check that required fields have asterisk
    const nameLabel = screen.getByText(/name/i)
    expect(nameLabel.closest('label')?.textContent).toContain('*')
  })
})
