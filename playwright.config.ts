import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.integration") });

export default defineConfig({
  testDir: "./playwright/tests",
  outputDir: "./playwright/test-results/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : [["html", { outputFolder: "./playwright/report" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
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
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["auth setup"],
      teardown: "cleanup db",
      testMatch: /(?!login\.).*\.spec\.ts/,
    },
    {
      name: "auth tests",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /login\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "",
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || "",
      E2E_USERNAME: process.env.E2E_USERNAME || "",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "",
    },
  },
});
