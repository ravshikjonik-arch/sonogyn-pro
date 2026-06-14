import { mkdirSync } from "node:fs";
import path from "node:path";

import { test as setup } from "@playwright/test";

const authDir = path.join(__dirname, ".auth");
const doctorState = path.join(authDir, "doctor.json");

setup("prepare doctor storage state", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });
  await page.goto("/app");
  await page.waitForURL(/\/app/, { timeout: 60_000 });
  await page.context().storageState({ path: doctorState });
});
