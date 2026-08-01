import { expect, test } from "@playwright/test";

/**
 * Soft visual smoke — runs only when VISUAL_REGRESSION=true.
 * First run (create baselines):
 *   VISUAL_REGRESSION=true pnpm test:e2e:visual --update-snapshots
 * Compare:
 *   VISUAL_REGRESSION=true pnpm test:e2e:visual
 */
const ENABLED = process.env.VISUAL_REGRESSION === "true";

test.describe("Visual smoke", () => {
  test.skip(!ENABLED, "Set VISUAL_REGRESSION=true to enable visual smoke");

  test("landing viewport", async ({ page }) => {
    await page.goto("/landing", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot("landing.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("login viewport", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot("login.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
