import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';

test.describe('Home Page', () => {
  test('should load the home page correctly', async ({ page }, testInfo) => {
    const homePage = new HomePage(page);
    
    // Navigate to the home page
    await homePage.goto();
    
    // Verify the page loaded correctly
    await homePage.expectPageLoaded();
    
    // Take a screenshot for visual comparison and update the snapshot
    // Use the new snapshot for subsequent runs
    await expect(page).toHaveScreenshot('home-page.png', {
      // Force update on the first run to create the baseline
      maxDiffPixelRatio: 0.1,
    });
  });

  test('navigation to login works correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    
    // Start at home page
    await homePage.goto();
    
    // Click the Login link using the page object method
    await homePage.clickLogin();
    
    // Verify navigation worked
    await expect(page).toHaveURL(/.*login/);
  });
}); 