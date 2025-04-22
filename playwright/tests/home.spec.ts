import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';

// Testy dla zalogowanego użytkownika
test.describe('Home Page (logged in user)', () => {
  // Skonfiguruj test, aby używał predefiniowanej autoryzacji
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should load the home page correctly for logged-in user', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    // Zrób zrzut ekranu strony głównej dla zalogowanego użytkownika
    await page.screenshot({ path: 'playwright/screenshots/home-page-logged-in.png' });
    
    // Sprawdź czy nagłówek zawiera powitanie
    const welcomeHeader = page.locator('h1:has-text("Welcome")');
    await expect(welcomeHeader).toBeVisible();
  });

  test('navigation to travel notes works correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    await page.getByTestId('travel-notes-button').click();
    
    await expect(page).toHaveURL(/.*travel-notes/);
  });
});

// Testy dla niezalogowanego użytkownika
test.describe('Home Page (not logged in user)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login/register buttons for non-logged-in user', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    
    await expect(page.getByTestId('login-link')).toBeVisible();
    await expect(page.getByTestId('register-button')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/travel-notes/new');
    
    await expect(page).toHaveURL(/.*login/);
  });
}); 