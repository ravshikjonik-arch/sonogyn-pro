import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

/** Security smoke must not bypass auth (CI sets DEV_SKIP_AUTH=true for CPI e2e). */
const devSkipAuthForWebServer =
  process.env.PLAYWRIGHT_SECURITY_E2E === "true" || process.env.E2E_DEV_SKIP_AUTH === "false"
    ? "false"
    : (process.env.DEV_SKIP_AUTH ?? "true");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ru-RU",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "tests/e2e/.auth/doctor.json"),
      },
      dependencies: ["setup"],
      testIgnore: /auth\.spec\.ts/,
    },
    {
      name: "chromium-no-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /auth\.spec\.ts|cpi-evaluate\.spec\.ts|security-smoke\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm exec --yes pnpm@10.6.5 -- dev",
    cwd: __dirname,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      E2E_FIXTURES: "true",
      NEXT_PUBLIC_E2E_FIXTURES: "true",
      DEV_SKIP_AUTH: devSkipAuthForWebServer,
      DEV_AUTO_LOGIN: "false",
    },
  },
});
