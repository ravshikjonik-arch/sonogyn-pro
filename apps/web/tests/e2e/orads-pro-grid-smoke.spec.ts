import { expect, test } from "@playwright/test";

const ORADS_ROUTE = "/tools/calc/rads/o-rads";

test.describe("O-RADS unified calculator smoke", () => {
  test("GET /tools/calc/rads/o-rads returns 200", async ({ request }) => {
    const res = await request.get(ORADS_ROUTE);
    expect(res.status()).toBe(200);
  });

  test("unified shell and stratification result", async ({ page }) => {
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-e2e-clinical-shell]")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-e2e-orads-unified]")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/единый калькулятор|стратификации/i).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Однокамерная/i }).click();
    await page.getByLabel(/Макс\. диаметр/i).fill("3");
    await page.getByLabel(/Менопауза/i).selectOption("pre");

    await expect(page.locator("[data-e2e-orads-category='1']")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("[data-e2e-clinical-disclaimer]")).toBeVisible();
  });

  test("categories 2 and 5 reachable via morphology", async ({ page }) => {
    await page.goto(ORADS_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-e2e-orads-unified]")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Двухкамерная/i }).click();
    await page.getByLabel(/Макс\. диаметр/i).fill("5");
    await expect(page.locator("[data-e2e-orads-category='2']")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /Сброс/i }).click();
    await page.getByRole("button", { name: /Однокамерная/i }).click();
    await page.getByLabel(/Макс\. диаметр/i).fill("4");
    await page.getByLabel(/Доп\. признаки/i).selectOption("ascites");
    await expect(page.locator("[data-e2e-orads-category='5']")).toBeVisible({ timeout: 10_000 });
  });
});
