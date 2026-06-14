import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import { installEmrMockBackend } from "./helpers/mock-backend";

test.describe("Электронные рецепты (E2E demo)", () => {
  test.beforeEach(async ({ page }) => {
    await installEmrMockBackend(page);
    await page.goto("/demo/emr");
  });

  test("создание рецепта с выбором лекарства и дозировки", async ({ page }) => {
    await page.getByTestId("prescription-drug").fill(testData.prescription.drug);
    await page.getByTestId("prescription-dose").fill(testData.prescription.dose);

    await page.getByTestId("prescription-save").click();
    await expect(page.getByTestId("prescription-saved-msg")).toBeVisible();
    await expect(page.getByTestId("prescription-saved-msg")).toContainText("Рецепт сохранён");
  });
});
