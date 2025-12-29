import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BFI CFO Bot/i);
  });
});

test.describe("Chat page", () => {
  test("displays welcome message", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByText("Welcome to BFI CFO Bot")).toBeVisible();
  });
});
