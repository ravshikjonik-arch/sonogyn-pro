import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import { installEmrMockBackend } from "./helpers/mock-backend";

test.describe("Создание нового приёма", () => {
  test.beforeEach(async ({ page }) => {
    await installEmrMockBackend(page);
    await page.goto("/demo/emr");
  });

  test("создание приёма с жалобами, диагнозом и сохранением", async ({ page }) => {
    await page.getByTestId("appointment-complaints").fill(testData.appointment.complaints);
    await page.getByTestId("appointment-diagnosis").fill("N94.6 — дисменорея");

    await page.getByTestId("appointment-save").click();
    await expect(page.getByTestId("appointment-saved-msg")).toBeVisible({ timeout: 10_000 });

    await expect(page.getByTestId("schedule-list")).toBeVisible();
  });

  test("негативный сценарий — пустые жалобы не блокируют мок, но сообщение не появляется без клика", async ({
    page,
  }) => {
    await expect(page.getByTestId("appointment-saved-msg")).toHaveCount(0);
    await page.getByTestId("appointment-save").click();
    await expect(page.getByTestId("appointment-saved-msg")).toBeVisible();
  });
});
