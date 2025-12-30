import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { TypingIndicator } from './TypingIndicator'

describe('TypingIndicator', () => {
  it('renders three animated dots', () => {
    const { container } = render(<TypingIndicator />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('positions indicator on the left like assistant messages', () => {
    const { container } = render(<TypingIndicator />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('justify-start')
  })

  it('applies different animation delays to create sequential bounce effect', () => {
    const { container } = render(<TypingIndicator />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots[0]).toHaveClass('[animation-delay:-0.3s]')
    expect(dots[1]).toHaveClass('[animation-delay:-0.15s]')
    expect(dots[2]).not.toHaveClass('[animation-delay:-0.3s]')
    expect(dots[2]).not.toHaveClass('[animation-delay:-0.15s]')
  })

  it('has styling consistent with assistant message bubble', () => {
    const { container } = render(<TypingIndicator />)

    const bubble = container.querySelector('.bg-white.border.border-border.rounded-lg')
    expect(bubble).toBeInTheDocument()
  })

  it('accepts and applies custom className', () => {
    const { container } = render(<TypingIndicator className="custom-class" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })
})
