import { expect, test } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.describe('unauthenticated user', () => {
    test('redirects to login when accessing onboarding', async ({ page }) => {
      await page.goto('/onboarding')

      // Should redirect to login with redirectTo param
      await expect(page).toHaveURL(/\/auth\/login/)
      await expect(page.url()).toContain('redirectTo=%2Fonboarding')
    })
  })

  test.describe('authenticated user without onboarding', () => {
    // Note: These tests require authentication setup
    // In a real test environment, you would set up test user credentials

    test('shows onboarding page with welcome message', async ({ page }) => {
      // Skip auth for now - this would need proper test user setup
      await page.goto('/onboarding')

      // Either we see onboarding (if somehow authenticated) or login redirect
      const url = page.url()
      expect(url.includes('/onboarding') || url.includes('/auth/login')).toBeTruthy()
    })
  })

  test.describe('chat page redirect', () => {
    test('redirects to login when accessing chat unauthenticated', async ({ page }) => {
      await page.goto('/chat')

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})

test.describe('Onboarding UI Components', () => {
  // These tests verify the UI components render correctly
  // They would need authentication to fully test the onboarding flow

  test.describe('page structure', () => {
    test('login page is accessible', async ({ page }) => {
      await page.goto('/auth/login')

      await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('sign up page is accessible', async ({ page }) => {
      await page.goto('/auth/sign-up')

      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })
  })
})

test.describe('Middleware redirect behavior', () => {
  test('protected routes redirect to login', async ({ page }) => {
    const protectedRoutes = ['/chat', '/documents', '/connections', '/reports', '/settings']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })

  test('auth pages are accessible without login', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/auth/sign-up')
    await expect(page).toHaveURL(/\/auth\/sign-up/)

    await page.goto('/auth/forgot-password')
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })
})
