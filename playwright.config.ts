import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  outputDir: './playwright/test-results/',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './playwright/report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'auth setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'cleanup db',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use the saved storage state from the auth setup
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['auth setup'],
      teardown: 'cleanup db',
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4322',
    port: 4322,
    reuseExistingServer: !process.env.CI,
  },
}); 