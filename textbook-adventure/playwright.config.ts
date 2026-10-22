import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:4185",
    trace: "retain-on-failure",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npm run dev -- --port 4185",
    url: "http://127.0.0.1:4185",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "touch",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    { name: "safari", use: { ...devices["iPhone 13"] } },
  ],
});
