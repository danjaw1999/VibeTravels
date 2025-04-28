import { test, expect } from "@playwright/test";
import { loadEnvironmentVariables } from "./utils/env-loader";

test.describe("Travel Note Creation (logged in user)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  test.beforeEach(async ({ page }) => {
    loadEnvironmentVariables();
    await page.waitForLoadState("networkidle");
    await page.goto("/travel-notes");
  });
  test("should create a new travel note", async ({ page }) => {
    await page.getByTestId("create-note-button").click();
    const noteName = `E2E Test Note ${Date.now()}`;
    await page.getByTestId("name-input").fill(noteName);
    await page.getByTestId("description-input").fill("This is an automated E2E test travel note");
    await page.getByTestId("is-public-checkbox").check();
    await page.getByTestId("submit-button").click();
    await page.waitForURL("**/travel-notes/**");
    await expect(page.getByRole("heading", { name: noteName })).toBeVisible();
  });
});
