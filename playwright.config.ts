import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  outputDir: "./playwright/test-results/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : [["html", { outputFolder: "./playwright/report" }], ["list"]],
  use: {
    baseURL: "http://localhost:4322",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "auth setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "cleanup db",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "logged-in tests",
      use: {
        ...devices["Desktop Chrome"],
        // Use the saved storage state from the auth setup
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["auth setup"],
      teardown: "cleanup db",
      testMatch: /(?!login\.).*\.spec\.ts/, // Wszystkie testy oprócz login.spec.ts
    },
    {
      name: "auth tests",
      use: {
        ...devices["Desktop Chrome"],
        // Nie używamy zapisanego stanu - zaczynamy bez zalogowania
      },
      testMatch: /login\.spec\.ts/, // Tylko testy logowania
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4322",
    port: 4322,
    reuseExistingServer: !process.env.CI,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || "",
      E2E_USERNAME: process.env.E2E_USERNAME || "",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "",
    },
  },
});
