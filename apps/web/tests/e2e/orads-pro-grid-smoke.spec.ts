import { expect, test } from "@playwright/test";

const ORADS_ROUTE = "/tools/calc/rads/o-rads";

test.describe("O-RADS Pro category grid smoke", () => {
  test("GET /tools/calc/rads/o-rads returns 200", async ({ request }) => {
    const res = await request.get(ORADS_ROUTE);
    expect(res.status()).toBe(200);
  });

  test("category chips 2 / 4 / 5 visible in Pro flow", async ({ page }) => {
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-e2e-clinical-shell]")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/O-RADS/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/O-RADS 2|категори.*2|ROM.*2/i).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/O-RADS 4|папилляр|4/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/O-RADS 5|высок/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
