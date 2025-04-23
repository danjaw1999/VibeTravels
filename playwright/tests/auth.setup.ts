import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  // Get credentials from environment variables
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(`Missing E2E test credentials in environment variables. 
    E2E_USERNAME: ${email ? "exists" : "missing"}
    E2E_PASSWORD: ${password ? "exists" : "missing"}`);
  }

  // Navigate to login page
  await page.goto("/login");

  // Fill in login form
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);

  // Submit form
  await page.getByTestId("login-submit-button").click();

  // Wait for navigation to the home page
  await page.waitForURL("/");

  // Store authentication state
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
