import { test, expect } from '@playwright/test';

test.describe('Travel Note Creation', () => {
  test('should create a new travel note', async ({ page }) => {
    // Navigate to the travel notes page
    await page.goto('/travel-notes');

    // Click on create new travel note button
    await page.getByTestId('create-note-button').click();

    // Generate a unique name for this test run to avoid conflicts
    const noteName = `E2E Test Note ${Date.now()}`;
    
    // Fill in the form
    await page.getByTestId('name-input').fill(noteName);
    await page.getByTestId('description-input').fill('This is an automated E2E test travel note');
    
    // Set visibility to public
    await page.getByTestId('is-public-checkbox').check();
    
    // Submit the form
    await page.getByTestId('submit-button').click();
    
    // Wait for the operation to complete and verify
    await page.waitForURL('**/travel-notes/**');
    
    // Verify the travel note was created successfully by finding the heading with the note name
    await expect(page.getByRole('heading', { name: noteName })).toBeVisible();
    
    console.log(`Successfully created travel note: ${noteName}`);
  });
}); 