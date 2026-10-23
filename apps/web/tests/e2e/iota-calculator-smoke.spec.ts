import { expect, test, type Page } from "@playwright/test";

const IOTA_ROUTE = "/tools/calc/rads/iota";

/** Golden vector — packages/iota-models/src/adnex.test.ts (~81.0% malignancy). */
const GOLDEN = {
  ageYears: "61",
  maxDiameterMm: "50",
  maxSolidMm: "45",
  ca125Uml: "20",
  expectedMalignancy: "81.0%",
} as const;

async function waitForIotaCalculator(page: Page) {
  await page.goto(IOTA_ROUTE, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-e2e-clinical-shell]")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /IOTA · ADNEX/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('[data-iota-calculator-hydrated="true"]')).toBeVisible({ timeout: 45_000 });
}

async function fillTextbox(page: Page, name: string, value: string) {
  const field = page.getByRole("textbox", { name });
  await field.click();
  await field.press("ControlOrMeta+a");
  await field.pressSequentially(value, { delay: 15 });
  await field.blur();
  await expect(field).toHaveValue(value);
}

async function expectAdnexResult(page: Page) {
  await expect(page.getByRole("heading", { name: "Результат ADNEX" })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("IOTA calculator smoke", () => {
  test("GET /tools/calc/rads/iota returns 200 HTML", async ({ request }) => {
    const res = await request.get(IOTA_ROUTE);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("html");
    expect(html).toMatch(/ADNEX|IOTA/i);
  });
});

test.describe("IOTA calculator UI", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test("golden ADNEX case shows ~81% malignancy after form fill", async ({ page }) => {
    await waitForIotaCalculator(page);

    await fillTextbox(page, "Возраст пациента в годах", GOLDEN.ageYears);
    await fillTextbox(page, "Максимальный диаметр образования в миллиметрах", GOLDEN.maxDiameterMm);
    await fillTextbox(page, "Максимальный диаметр солидного компонента в миллиметрах", GOLDEN.maxSolidMm);

    await page.getByRole("button", { name: "Другой центр" }).click();
    await page.getByRole("button", { name: ">10 камер" }).click();
    await page.getByRole("button", { name: "Асцит" }).click();

    const ca125Toggle = page.getByRole("checkbox", { name: "Использовать CA-125 в модели ADNEX" });
    await ca125Toggle.check();
    await expect(page.getByRole("textbox", { name: "Уровень CA-125" })).toBeVisible();
    await fillTextbox(page, "Уровень CA-125", GOLDEN.ca125Uml);

    await expectAdnexResult(page);
    await expect(
      page.getByText(new RegExp(`Суммарный риск злокачественности:\\s*${GOLDEN.expectedMalignancy}`)),
    ).toBeVisible();
    await expect(page.locator("p.text-sm", { hasText: /^Simple Rules Risk:/ })).toBeVisible();
    await expect(page.locator("p.text-sm", { hasText: /^LR2:/ })).toBeVisible();
  });

  test("O-RADS compare appears when category is entered", async ({ page }) => {
    await waitForIotaCalculator(page);

    await fillTextbox(page, "Возраст пациента в годах", "45");
    await fillTextbox(page, "Максимальный диаметр образования в миллиметрах", "40");
    await fillTextbox(page, "Максимальный диаметр солидного компонента в миллиметрах", "0");
    await page.getByRole("button", { name: "Другой центр" }).click();
    await page.getByRole("button", { name: "Акустическая тень" }).click();

    await expectAdnexResult(page);

    await fillTextbox(page, "Категория O-RADS US от 1 до 5", "2");

    await expect(page.getByText(/согласуется с O-RADS US 2/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
