import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { BackToChatLink } from './BackToChatLink'

import type { WindowWithNavHandler } from '@/types/navigation'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('BackToChatLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up window handler
    delete (window as WindowWithNavHandler).__handleSettingsNavigation
  })

  describe('rendering', () => {
    it('renders back to chat text', () => {
      render(<BackToChatLink />)

      expect(screen.getByText(/back to chat/i)).toBeInTheDocument()
    })

    it('renders arrow icon', () => {
      render(<BackToChatLink />)

      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('accepts className prop', () => {
      render(<BackToChatLink className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('navigation', () => {
    it('uses router.push when no handler is set', async () => {
      render(<BackToChatLink />)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockPush).toHaveBeenCalledWith('/chat')
    })

    it('uses window handler when available', async () => {
      const mockHandler = vi.fn()
      ;(window as WindowWithNavHandler).__handleSettingsNavigation = mockHandler

      render(<BackToChatLink />)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockHandler).toHaveBeenCalledWith('/chat')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
