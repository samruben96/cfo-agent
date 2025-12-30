/**
 * Unit tests for SoftwareCostItem component
 * Story: 3-1-overhead-cost-intake-form
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { SoftwareCostItem } from './SoftwareCostItem'

import type { SoftwareCost } from '@/types/overhead-costs'

describe('SoftwareCostItem', () => {
  const mockSoftware: SoftwareCost = {
    id: 'test-123',
    name: 'Slack',
    monthlyCost: 25,
  }

  it('renders software name and cost inputs', () => {
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    const nameInput = screen.getByLabelText('Software name')
    const costInput = screen.getByLabelText('Monthly cost')

    expect(nameInput).toHaveValue('Slack')
    expect(costInput).toHaveValue(25)
  })

  it('calls onUpdate when name is changed', () => {
    const onUpdate = vi.fn()
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    )

    const nameInput = screen.getByLabelText('Software name')
    fireEvent.change(nameInput, { target: { value: 'Teams' } })

    expect(onUpdate).toHaveBeenCalledWith({ name: 'Teams' })
  })

  it('calls onUpdate when cost is changed', () => {
    const onUpdate = vi.fn()
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    )

    const costInput = screen.getByLabelText('Monthly cost')
    fireEvent.change(costInput, { target: { value: '50' } })

    expect(onUpdate).toHaveBeenCalledWith({ monthlyCost: 50 })
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn()
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={vi.fn()}
        onRemove={onRemove}
      />
    )

    const removeButton = screen.getByLabelText('Remove software')
    fireEvent.click(removeButton)

    expect(onRemove).toHaveBeenCalled()
  })

  it('disables all inputs when disabled is true', () => {
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        disabled
      />
    )

    expect(screen.getByLabelText('Software name')).toBeDisabled()
    expect(screen.getByLabelText('Monthly cost')).toBeDisabled()
    expect(screen.getByLabelText('Remove software')).toBeDisabled()
  })

  it('displays error message when error prop is provided', () => {
    render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        error="Cost must be positive"
      />
    )

    expect(screen.getByText('Cost must be positive')).toBeInTheDocument()
  })

  it('handles empty cost value', () => {
    const emptySoftware: SoftwareCost = {
      id: 'test-456',
      name: 'New Software',
      monthlyCost: 0,
    }

    render(
      <SoftwareCostItem
        software={emptySoftware}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    const costInput = screen.getByLabelText('Monthly cost')
    expect(costInput).toHaveValue(null)
  })

  it('accepts className prop', () => {
    const { container } = render(
      <SoftwareCostItem
        software={mockSoftware}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
