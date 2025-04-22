import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Authentication tests', () => {
  test('Login with environment variables', async ({ page }) => {
    // Get credentials from environment variables
    const email = import.meta.env.E2E_USERNAME;
    const password = import.meta.env.E2E_PASSWORD;

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
      console.log('Could not click logout button, trying to navigate to logout page');
      try {
        await page.goto('/logout');
      } catch (logoutError) {
        console.log('Logout failed or not necessary');
      }
    }
  });
}); 