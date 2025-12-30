import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BFI CFO Bot/i);
  });
});

test.describe("Chat page", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/chat");
    // Chat is protected, so it should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
