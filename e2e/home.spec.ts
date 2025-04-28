import { test, expect } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

test.describe("Home Page (logged in user)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should load the home page correctly for logged-in user", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    const welcomeHeader = page.locator('h1:has-text("Welcome")');
    await expect(welcomeHeader).toBeVisible();
  });

  test("navigation to travel notes works correctly", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await page.getByTestId("travel-notes-button").click();
    await expect(page).toHaveURL(/.*travel-notes/);
  });

  test("create travel note should be visible", async ({ page }) => {
    await page.goto("/travel-notes/new");
    await expect(page.getByTestId("submit-button")).toBeVisible();
  });
});
