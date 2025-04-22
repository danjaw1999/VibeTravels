import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Authentication tests', () => {
  test.beforeEach(async ({ page }) => {
    // Upewnij się, że użytkownik jest wylogowany przed testem logowania
    try {
      // Spróbuj odwiedzić stronę wylogowania
      await page.goto('/logout');
    } catch (error) {
    }
    
    // Opcjonalnie - wyczyść localStorage i cookies aby mieć pewność
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test('Login with environment variables', async ({ page }) => {
    // Get credentials from environment variables (poprawiony sposób dostępu)
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    // Validate that environment variables are present
    if (!email || !password) {
      console.error('Missing required environment variables for E2E tests');
      test.skip();
      return;
    }

    // Initialize the login page
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.goto();
    
    // Upewnij się, że widzimy formularz logowania
    await expect(page.locator('form')).toBeVisible();
    
    // Take screenshot before login
    await page.screenshot({ path: 'playwright/screenshots/before-login.png' });
    
    // Perform login
    await loginPage.login(email, password);
    
    // Verify successful login by URL change
    await loginPage.verifySuccessfulLogin();
    
    // Take screenshot after successful login
    await page.screenshot({ path: 'playwright/screenshots/after-login.png' });
    
    // Make sure we're no longer on the login page
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Logout if possible
    try {
      // Try clicking the logout button if it exists
      await page.locator('[data-testid="logout-button"]').click({ timeout: 5000 });
    } catch (error) {
      try {
        await page.goto('/logout');
      } catch (logoutError) {
      }
    }
  });
}); 