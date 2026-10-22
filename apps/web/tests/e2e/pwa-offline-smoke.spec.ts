import { expect, test } from "@playwright/test";

const ORADS_ROUTE = "/tools/calc/rads/o-rads";
const pwaE2e = process.env.PWA_E2E === "1";

test.describe("PWA offline smoke (production build)", () => {
  test.skip(!pwaE2e, "Set PWA_E2E=1 after `pnpm build` and run with `pnpm test:e2e:pwa`");

  test("O-RADS loads offline after service worker precache", async ({ page, context }) => {
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-e2e-clinical-shell]")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/O-RADS/i).first()).toBeVisible({ timeout: 60_000 });

    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return Boolean(reg?.active);
      },
      undefined,
      { timeout: 90_000 },
    );

    await context.setOffline(true);
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/O-RADS/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("Cache Storage has no Supabase or /api/ entries after O-RADS visit", async ({ page }) => {
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return Boolean(reg?.active);
      },
      undefined,
      { timeout: 90_000 },
    );

    const badUrls = await page.evaluate(async () => {
      const hits: string[] = [];
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        const reqs = await cache.keys();
        for (const req of reqs) {
          const u = req.url;
          if (u.includes("supabase.co") || u.includes("/api/") || u.includes("/auth/v1")) {
            hits.push(u);
          }
        }
      }
      return hits;
    });

    expect(badUrls, `unexpected cached URLs: ${badUrls.join(", ")}`).toEqual([]);
  });
});
