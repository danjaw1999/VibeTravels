import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly loginLink: Locator;
  readonly createNoteButton: Locator;
  readonly browseNotesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Welcome to VibeTravels');
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.createNoteButton = page.getByRole('link', { name: /Create Note/i });
    this.browseNotesButton = page.getByRole('link', { name: /Browse Notes/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectPageLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.page).toHaveTitle(/VibeTravels/);
  }

  async clickLogin() {
    await this.loginLink.click();
  }

  async clickCreateNote() {
    await this.createNoteButton.click();
  }

  async clickBrowseNotes() {
    await this.browseNotesButton.click();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./playwright/screenshots/${name}.png` });
  }
} 