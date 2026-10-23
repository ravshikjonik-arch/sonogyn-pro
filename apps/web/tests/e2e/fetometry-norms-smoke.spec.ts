import { expect, test } from "@playwright/test";

const PAGE = "/tools/calc/ob/fetometry-norms";

test.describe("Fetometry norms calculator smoke", () => {
  test("GET page metadata and hub shell", async ({ request }) => {
    const res = await request.get(PAGE);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/Калькулятор норм фетометрии/i);
    expect(html).toContain("fetometry-norms");
    expect(html).toMatch(/96 таблиц|Мастер номограмм|medvedev-archive|clinical\/medvedev-archive/i);
  });

  test("nomogram wizard shell", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByRole("heading", { name: /Калькулятор фетометрии/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("tab", { name: /Мастер номограмм/i })).toBeVisible();
    await expect(page.getByText(/Дерево решений · номограммы/i)).toBeVisible();
  });

  test("table 2.17 sylvian @ 20w → ~50th percentile", async ({ page }) => {
    await page.goto(`${PAGE}?table=2.17`);
    await expect(page.getByRole("heading", { name: /Калькулятор фетометрии/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("tab", { name: /Каталог книги/i }).click();
    await expect(page.getByText(/96 калькуляторов/i)).toBeVisible();
    await page.getByRole("textbox", { name: "Сильвиева борозда, mm" }).fill("5.85");
    await expect(page.getByRole("status")).toContainText(/50/i);
    await expect(page.getByRole("status")).toContainText(/5\.85/);
  });
});
