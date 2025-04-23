import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  // Get credentials from environment variables
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;


  if (!email || !password) {
    throw new Error(`Missing E2E test credentials in environment variables. 
    E2E_USERNAME: ${email ? "exists" : "missing"}
    E2E_PASSWORD: ${password ? "exists" : "missing"}`);
  }

  try {
    // Navigate to login page
    await page.goto("/login", { timeout: 30000, waitUntil: "networkidle" });
    
    await page.getByTestId("email-input").fill(email);
    await page.getByTestId("password-input").fill(password);


    const submitButton = page.getByTestId("login-submit-button");
    
    // Tworzymy promise do śledzenia odpowiedzi
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') || 
                 response.url().includes('supabase'),
      { timeout: 20000 }
    );
    
    await submitButton.click();
    
    const response = await responsePromise;
    
    if (response.status() >= 400) {
      console.error(`Login failed with status ${response.status()}`);
      const responseText = await response.text();
      console.error(`Response body: ${responseText}`);
    }

    await Promise.race([
      page.waitForURL("/*", { timeout: 30000 }),
      page.waitForURL("/**", { timeout: 30000 }),
      page.waitForSelector('[data-testid="logged-in-menu"]', { timeout: 30000 })
    ]);

    const isLoggedIn = await page.getByTestId("logged-in-menu").isVisible();
    if (!isLoggedIn) {
      const pageContent = await page.content();
      console.error(`Page content: ${pageContent.substring(0, 500)}...`);
      throw new Error("Login seems successful but user doesn't appear to be logged in");
    }

    await page.context().storageState({ path: "playwright/.auth/user.json" });
    
  } catch (error) {
    await page.screenshot({ path: 'auth-failure.png', fullPage: true });
    throw error;
  }
});
