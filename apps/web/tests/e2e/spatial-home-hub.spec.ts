import { expect, test } from "@playwright/test";

test.describe("Home welcome and nosology groups", () => {
  test("opening the site shows the welcome, then the nosology lists", async ({ page }) => {
    await page.goto("/home", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Начать" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Начать" }).click();
    await expect(page.getByRole("heading", { name: "Акушерство" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Гинекология" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Маммология" })).toBeVisible();
    await expect(page.getByRole("link", { name: /O-RADS/ }).first()).toBeVisible();
  });
});
