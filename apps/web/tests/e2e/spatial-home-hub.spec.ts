import { expect, test } from "@playwright/test";

test.describe("Spatial home hub", () => {
  test("home shows horizontal hub deck and RADS section", async ({ page }) => {
    await page.goto("/home", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /SonoGyn Pro/i }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("RADS и риск")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Главные разделы платформы")).toBeVisible();
  });

  test("?hub=rads opens modal with O-RADS link", async ({ page }) => {
    await page.goto("/home?hub=rads", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: /O-RADS/i }).first()).toBeVisible();
  });
});
