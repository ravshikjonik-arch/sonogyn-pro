import { expect, test } from "@playwright/test";

test.describe("fetometry book panel", () => {
  test("T1 NT evaluates against CRL band", async ({ page }) => {
    await page.goto("/tools/calc/ob/fetometry");
    await expect(page.locator("[data-e2e-fetometry-book]")).toBeVisible();

    await page.locator("[data-e2e-fetometry-ga-weeks]").fill("12");
    await page.locator("[data-e2e-fetometry-crl]").fill("47");
    await page.locator('[data-e2e-fetometry-field="t1.nt"]').fill("1.52");

    await expect(page.locator('[data-e2e-fetometry-result="t1.nt"]')).toBeVisible();
    await expect(page.locator('[data-e2e-fetometry-result="t1.nt"]')).toHaveAttribute("data-zone", "normal");
    await expect(page.getByText(/Не является диагнозом/i)).toBeVisible();
  });

  test("II–III tab and population selector render", async ({ page }) => {
    await page.goto("/tools/calc/ob/fetometry");
    await page.locator('[data-e2e-fetometry-tab="t2_base"]').click();
    await expect(page.locator("[data-e2e-fetometry-population]")).toBeVisible();
    await page.locator("[data-e2e-fetometry-ga-weeks]").fill("16");
    await page.locator('[data-e2e-fetometry-field="t2.bpd"]').fill("30");
    await expect(page.locator('[data-e2e-fetometry-result="t2.bpd"]')).toHaveAttribute("data-zone", "below");
  });
});
