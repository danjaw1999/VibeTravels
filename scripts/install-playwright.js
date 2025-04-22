#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Script to install Playwright browsers
 * This script should be run during project setup or in CI environments
 */

console.log("📥 Installing Playwright browsers...");

try {
  // Check if the browsers are already installed
  const browsersPath = join(process.cwd(), "node_modules", ".playwright", "chromium-");

  if (existsSync(browsersPath)) {
    console.log("✅ Playwright browsers already installed");
  } else {
    // Install only Chromium browser as specified in the guidelines
    console.log("Installing Chromium browser for Playwright...");
    execSync("npx playwright install chromium", { stdio: "inherit" });
    console.log("✅ Playwright browser installation complete");
  }
} catch (error) {
  console.error("❌ Failed to install Playwright browsers:", error);
  process.exit(1);
}
