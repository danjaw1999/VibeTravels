import { test, expect } from "@playwright/test";
import { loadEnvironmentVariables } from "./utils/env-loader";
import { getFeatureFlags } from "./utils/feature-flags";

const featureFlags = getFeatureFlags();

// Skip the entire describe block if features are disabled
test.skip(
  !featureFlags.auth || !featureFlags["create-travel-note"],
  "Required features (auth or create-travel-note) are disabled"
);

test.describe("Travel Note Creation (logged in user)", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

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
