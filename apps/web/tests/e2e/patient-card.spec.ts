import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import { mockPatientsApi } from "./helpers/mock-backend";

test.describe("Карта пациента", () => {
  test("поиск по ФИО и открытие карты", async ({ page }) => {
    const patients = await mockPatientsApi(page);
    patients.seed();

    await page.goto("/patients");
    await expect(page.getByTestId("patients-page")).toBeVisible();

    await page.getByTestId("patient-search").fill("Иванова");
    await expect(page.getByTestId("patient-list-item")).toHaveCount(1);
    await expect(page.getByTestId("patient-list-item")).toContainText(testData.patient.displayLabel);

    await page.getByTestId("patient-list-item").click();
    await expect(page).toHaveURL(/\/demo\/patient-card/);
    await expect(page.getByTestId("patient-card")).toBeVisible();
    await expect(page.getByTestId("patient-card-name")).toHaveText(testData.patient.displayLabel);

    patients.clear();
  });

  test("поиск по номеру карты", async ({ page }) => {
    const patients = await mockPatientsApi(page);
    patients.seed();

    await page.goto("/patients");
    await page.getByTestId("patient-search").fill("KART-2026");
    await expect(page.getByTestId("patient-list-item")).toHaveCount(1);

    patients.clear();
  });

  test("добавление записи в историю и редактирование диагноза", async ({ page }) => {
    const patients = await mockPatientsApi(page);
    patients.seed();

    await page.goto("/demo/patient-card?id=patient-seed-1");
    await expect(page.getByTestId("patient-card")).toBeVisible();

    const newNote = "Новая запись: контроль УЗИ через 3 месяца.";
    await page.getByTestId("patient-history-notes").fill(newNote);

    const newDiagnosis = "Leiomyoma uteri, FIGO 5 — контроль";
    await page.getByTestId("patient-diagnosis").fill(newDiagnosis);

    await page.getByTestId("patient-save").click();
    await expect(page.getByTestId("patient-saved-msg")).toBeVisible();

    patients.clear();
  });
});
