import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "./.auth/user.json");

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
}

setup("authenticate", async ({ page }) => {
  // Navigate to login page and wait for it to load
  await page.goto("/login");

  // Wait for and fill email input
  const emailInput = page.getByTestId("email-input");
  await emailInput.waitFor({ state: "visible" });
  await emailInput.click();
  await emailInput.fill(E2E_USERNAME);
  await expect(emailInput).toHaveValue(E2E_USERNAME);

  // Wait for and fill password input
  const passwordInput = page.getByTestId("password-input");
  await passwordInput.waitFor({ state: "visible" });
  await passwordInput.click();
  await passwordInput.fill(E2E_PASSWORD);
  await expect(passwordInput).toHaveValue(E2E_PASSWORD);

  // Wait for and click submit button
  const submitButton = page.getByTestId("login-submit-button");
  await submitButton.waitFor({ state: "visible" });
  await submitButton.click();

  // Wait for successful navigation and verify we're logged in
  await expect(page.getByTestId("logout-button")).toBeVisible({
    timeout: 10000,
  });

  await page.context().storageState({ path: authFile });
});
