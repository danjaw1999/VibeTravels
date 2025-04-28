import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Using more generic selectors
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('div[data-testid="login-error"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/login");
    // Wait for the page to be fully loaded
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
  }

  /**
   * Login with email and password
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Verify successful login by checking URL change
   */
  async verifySuccessfulLogin() {
    // Wait for the URL to change from /login
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  }
}
