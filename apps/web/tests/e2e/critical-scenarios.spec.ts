import { expect, test } from "@playwright/test";

import { installEmrMockBackend } from "./helpers/mock-backend";

test.describe("Критические сценарии", () => {
  test.beforeEach(async ({ page }) => {
    await installEmrMockBackend(page);
  });

  test("реакция на потерю интернета при сохранении", async ({ page, context }) => {
    await page.goto("/demo/emr");
    await page.getByTestId("appointment-complaints").fill("Черновик при офлайне");

    await context.setOffline(true);
    const savePromise = page.getByTestId("appointment-save").click();
    await savePromise;

    await expect(page.getByTestId("appointment-saved-msg")).toHaveCount(0);
    await context.setOffline(false);
  });

  test("автосохранение черновика в localStorage", async ({ page }) => {
    await page.goto("/demo/emr");
    const draft = "Автосохранённый черновик E2E";

    await page.getByTestId("appointment-complaints").fill(draft);
    await page.reload();

    await expect(page.getByTestId("appointment-complaints")).toHaveValue(draft);

    await page.evaluate(() => localStorage.removeItem("e2e-draft"));
  });

  test("конфликт при одновременном редактировании карты двумя врачами", async ({ page }) => {
    await page.goto("/demo/emr");
    await page.getByTestId("conflict-simulate").click();
    await expect(page.getByTestId("conflict-message")).toBeVisible();
    await expect(page.getByTestId("conflict-message")).toContainText("409");
  });

  test("152-ФЗ: PHI Notice и отсутствие ФИО в URL после выхода", async ({ page }) => {
    await page.goto("/demo/emr");
    await expect(page.getByText("PHI Notice")).toBeVisible();

    await page.goto("/patients");
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL(/\/landing/);
    expect(page.url()).not.toMatch(/Иванова|patient-seed/i);
  });
});
