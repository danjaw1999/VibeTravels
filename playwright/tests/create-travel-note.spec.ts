import { test, expect } from "@playwright/test";

// Testy dla zalogowanego użytkownika
test.describe("Travel Note Creation (logged in user)", () => {
  // Skonfiguruj test, aby używał predefiniowanej autoryzacji
  test.use({ storageState: "playwright/.auth/user.json" });

  test("travel notes page should load correctly", async ({ page }) => {
    await page.goto("/travel-notes");

    // Zrzut ekranu strony z listą notatek
    await page.screenshot({ path: "playwright/screenshots/travel-notes-list.png" });

    // Sprawdź czy tytuł zawiera "Travel Notes"
    const title = page.locator('h1:has-text("Travel Notes")');
    await expect(title).toBeVisible();
  });
});

// Testy dla niezalogowanego użytkownika
test.describe("Travel Note Creation (not logged in user)", () => {
  test("should redirect to login page when trying to create travel note", async ({ page }) => {
    await page.goto("/");

    await page.goto("/travel-notes/new");

    await expect(page).toHaveURL(/.*login/);
  });
});
