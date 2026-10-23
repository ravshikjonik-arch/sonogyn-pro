import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const pwaE2e = process.env.PWA_E2E === "1";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? (pwaE2e ? "http://127.0.0.1:3002" : "http://127.0.0.1:3000");

/** Security smoke must not bypass auth (CI sets DEV_SKIP_AUTH=true for CPI e2e). */
const securityE2e = process.env.PLAYWRIGHT_SECURITY_E2E === "true";

const devSkipAuthForWebServer =
  securityE2e || process.env.E2E_DEV_SKIP_AUTH === "false"
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
      testIgnore:
        /auth\.spec\.ts|cpi-evaluate\.spec\.ts|security-smoke\.spec\.ts|a11y-smoke\.spec\.ts|iota-calculator-smoke\.spec\.ts|evidence-assistant-smoke\.spec\.ts|fetometry-norms-smoke\.spec\.ts|visual-smoke\.spec\.ts|clinical-speech-smoke\.spec\.ts|clinical-speech-fake-mic\.spec\.ts/,
    },
    {
      name: "chromium-no-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch:
        /auth\.spec\.ts|cpi-evaluate\.spec\.ts|security-smoke\.spec\.ts|emr-idor-smoke\.spec\.ts|a11y-smoke\.spec\.ts|iota-calculator-smoke\.spec\.ts|evidence-assistant-smoke\.spec\.ts|fetometry-norms-smoke\.spec\.ts|visual-smoke\.spec\.ts|clinical-speech-smoke\.spec\.ts|clinical-speech-fake-mic\.spec\.ts|doctor-chat-v2-smoke\.spec\.ts/,
    },
    ...(pwaE2e
      ? [
          {
            name: "pwa-chromium",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /pwa-offline-smoke\.spec\.ts/,
          },
        ]
      : []),
  ],
  webServer: pwaE2e
    ? {
        command: "npm exec --yes pnpm@10.6.5 -- start -p 3002",
        cwd: __dirname,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          E2E_FIXTURES: "true",
          NEXT_PUBLIC_E2E_FIXTURES: "true",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ci-placeholder",
          OPEN_ACCESS_FULL: "true",
          NEXT_PUBLIC_OPEN_ACCESS_FULL: "true",
        },
      }
    : {
    command: "npm exec --yes pnpm@10.6.5 -- dev",
    cwd: __dirname,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      E2E_FIXTURES: "true",
      NEXT_PUBLIC_E2E_FIXTURES: "true",
      /** Stub auth + EMR fixtures (matches GitHub Actions CI e2e job). */
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ci-placeholder",
      DEV_SKIP_AUTH: devSkipAuthForWebServer,
      DEV_AUTO_LOGIN: "false",
      OPEN_ACCESS_FULL: "true",
      NEXT_PUBLIC_OPEN_ACCESS_FULL: "true",
      ...(securityE2e
        ? {
            OPEN_ACCESS_FULL: "false",
            NEXT_PUBLIC_OPEN_ACCESS_FULL: "false",
          }
        : {}),
    },
  },
});
