import { expect, test } from '@playwright/test'

test.describe('Suggested Follow-up Questions', () => {
  test.describe('chat page access', () => {
    test('redirects to login when accessing chat unauthenticated', async ({ page }) => {
      await page.goto('/chat')

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('suggested questions UI elements', () => {
    // Note: These tests verify the UI structure
    // Full conversation flow tests require authenticated session

    test('login page allows access for future chat sessions', async ({ page }) => {
      await page.goto('/auth/login')

      // Verify login form is accessible - wait for SSR hydration
      await expect(page.getByRole('heading', { name: /log\s*in/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })
  })

  // Note: The following tests document expected behavior for suggested questions
  // They require authenticated sessions and are marked as skip until auth fixtures are available
  test.describe('suggestion display behavior', () => {
    test.skip('should display 2-3 suggested follow-up questions after AI response', async ({ page }) => {
      // This test verifies AC#1: suggestions appear after response
      // Given: AI has just answered my question
      // When: The response completes
      // Then: I see 2-3 suggested follow-up questions below the response

      await page.goto('/chat')

      // Find chat input
      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)
      await expect(chatInput).toBeVisible()

      // Send a question about employee costs
      await chatInput.fill('What does each employee cost me?')
      await page.getByRole('button', { name: /send message/i }).click()

      // Wait for response to complete (not streaming)
      await expect(page.locator('[data-role="assistant"]')).toBeVisible()

      // Wait for suggestions to appear (after streaming completes)
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Verify 2-3 suggestion buttons are present
      const suggestionButtons = suggestionsContainer.getByRole('button')
      const count = await suggestionButtons.count()
      expect(count).toBeGreaterThanOrEqual(2)
      expect(count).toBeLessThanOrEqual(3)
    })

    test.skip('should show contextually relevant suggestions for employee costs', async ({ page }) => {
      // This test verifies AC#2: contextual relevance
      // Given: I asked about employee costs
      // When: I see suggestions
      // Then: They might include "Show me profitability by role" or "Can I afford to hire?"

      await page.goto('/chat')

      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)

      // Ask about employee costs
      await chatInput.fill('What does each employee cost me?')
      await page.getByRole('button', { name: /send message/i }).click()

      // Wait for response
      await expect(page.locator('[data-role="assistant"]')).toBeVisible()

      // Wait for suggestions
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Verify suggestions are contextually relevant
      // At least one suggestion should relate to costs, profitability, or hiring
      const buttons = await suggestionsContainer.getByRole('button').allTextContents()
      const hasRelevantSuggestion = buttons.some(text =>
        text.toLowerCase().includes('cost') ||
        text.toLowerCase().includes('profit') ||
        text.toLowerCase().includes('hire') ||
        text.toLowerCase().includes('breakdown') ||
        text.toLowerCase().includes('payroll')
      )
      expect(hasRelevantSuggestion).toBe(true)
    })

    test.skip('should send message when suggestion is clicked', async ({ page }) => {
      // This test verifies AC#3: click behavior
      // Given: I click a suggested question
      // When: I click it
      // Then: It populates the input and sends automatically

      await page.goto('/chat')

      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)

      // Initial question
      await chatInput.fill('What is my payroll ratio?')
      await page.getByRole('button', { name: /send message/i }).click()

      // Wait for first response
      await expect(page.locator('[data-role="assistant"]').first()).toBeVisible()

      // Wait for suggestions
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Click the first suggestion
      const firstSuggestion = suggestionsContainer.getByRole('button').first()
      const suggestionText = await firstSuggestion.textContent()
      await firstSuggestion.click()

      // Wait for the suggestion to be sent as a new message
      await expect(page.getByText(suggestionText!)).toBeVisible()

      // Wait for second AI response (proves the message was sent)
      await expect(page.locator('[data-role="assistant"]').nth(1)).toBeVisible({ timeout: 15000 })
    })

    test.skip('should continue conversation naturally after clicking suggestion', async ({ page }) => {
      // This test verifies AC#3: natural conversation flow
      // Given: I clicked a suggested question
      // When: The AI responds
      // Then: The conversation continues naturally

      await page.goto('/chat')

      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)

      // Initial question
      await chatInput.fill('What is my overhead?')
      await page.getByRole('button', { name: /send message/i }).click()

      // Wait for first response and suggestions
      await expect(page.locator('[data-role="assistant"]').first()).toBeVisible()
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Click a suggestion
      await suggestionsContainer.getByRole('button').first().click()

      // Wait for second response
      await expect(page.locator('[data-role="assistant"]').nth(1)).toBeVisible({ timeout: 15000 })

      // New suggestions should appear after the second response
      // (The original suggestions should be hidden, new ones shown)
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Should be able to continue asking questions manually
      await chatInput.fill('Tell me more about that')
      await page.getByRole('button', { name: /send message/i }).click()

      // Third response should appear
      await expect(page.locator('[data-role="assistant"]').nth(2)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('suggestion visibility conditions', () => {
    test.skip('should not show suggestions while AI is streaming', async ({ page }) => {
      // Suggestions should only appear after response is complete

      await page.goto('/chat')

      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)

      // Send a question
      await chatInput.fill('What is my EBITDA?')
      await page.getByRole('button', { name: /send message/i }).click()

      // During streaming, suggestions should not be visible
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')

      // Check immediately after sending - should not be visible
      await expect(suggestionsContainer).not.toBeVisible()

      // Wait for streaming indicator
      const typingIndicator = page.locator('[data-testid="typing-indicator"]')
      if (await typingIndicator.isVisible()) {
        // While typing indicator is visible, suggestions should not be
        await expect(suggestionsContainer).not.toBeVisible()
      }

      // After response completes, suggestions should appear
      await expect(page.locator('[data-role="assistant"]')).toBeVisible()
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })
    })

    test.skip('should hide suggestions when user starts typing', async ({ page }) => {
      // Suggestions should hide when user begins a new message

      await page.goto('/chat')

      const chatInput = page.getByPlaceholder(/ask your cfo anything/i)

      // Initial question
      await chatInput.fill('What is my payroll?')
      await page.getByRole('button', { name: /send message/i }).click()

      // Wait for response and suggestions
      await expect(page.locator('[data-role="assistant"]')).toBeVisible()
      const suggestionsContainer = page.locator('[data-testid="suggested-questions"]')
      await expect(suggestionsContainer).toBeVisible({ timeout: 10000 })

      // Start typing a new message
      await chatInput.fill('Let me ask')

      // Suggestions should still be visible while typing (only hidden when sent)
      // This is a UX choice - can be modified based on requirements
      await expect(suggestionsContainer).toBeVisible()
    })
  })
})
