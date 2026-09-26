import { defineConfig } from "@playwright/test";

// Run against the healthy Compose service, including its real auth and database.
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    browserName: "chromium",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
