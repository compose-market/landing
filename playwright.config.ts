import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:5178",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } }
    }
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5178",
    url: "http://127.0.0.1:5178",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
