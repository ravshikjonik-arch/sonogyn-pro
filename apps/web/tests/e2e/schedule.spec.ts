import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import { installEmrMockBackend } from "./helpers/mock-backend";

test.describe("Расписание приёмов (E2E demo)", () => {
  test.beforeEach(async ({ page }) => {
    await installEmrMockBackend(page);
    await page.goto("/demo/emr");
    await expect(page.getByTestId("emr-demo-page")).toBeVisible();
  });

  test("отображает расписание на сегодня", async ({ page }) => {
    await expect(page.getByTestId("schedule-title")).toBeVisible();
    await expect(page.getByTestId("schedule-slot")).toHaveCount(testData.schedule.today.length);

    const first = testData.schedule.today[0];
    await expect(page.getByTestId("schedule-slot-time").first()).toHaveText(first.time);
    await expect(page.getByTestId("schedule-slot-patient").first()).toHaveText(first.patientName);
    await expect(page.getByTestId("schedule-slot-complaint").first()).toHaveText(first.complaint);
  });

  test("переключение между днями", async ({ page }) => {
    await page.getByTestId("schedule-day-tomorrow").click();
    await expect(page.getByTestId("schedule-slot")).toHaveCount(testData.schedule.tomorrow.length);
    await expect(page.getByTestId("schedule-slot-patient").first()).toHaveText(
      testData.schedule.tomorrow[0].patientName,
    );

    await page.getByTestId("schedule-day-today").click();
    await expect(page.getByTestId("schedule-slot")).toHaveCount(testData.schedule.today.length);
  });
});
