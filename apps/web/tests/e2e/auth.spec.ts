import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import {
  loginAsDoctor,
  logoutFromShell,
  mockAuthSession,
  mockAuthSignIn,
  mockAuthSignOut,
} from "./helpers/mock-backend";

test.describe("Авторизация врача", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSignOut(page);
  });

  test("успешный вход и редирект на рабочий стол", async ({ page }) => {
    await mockAuthSignIn(page, true);
    await mockAuthSession(page, {
      email: testData.doctor.email,
      fullName: testData.doctor.fullName,
    });

    await loginAsDoctor(page, testData.doctor.email, testData.doctor.password);

    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByTestId("app-home")).toBeVisible();
  });

  test("неудачный вход с неверным паролем", async ({ page }) => {
    await mockAuthSignIn(page, false);
    await mockAuthSession(page, null);

    await loginAsDoctor(page, testData.doctor.email, "wrong-password");

    await expect(page.getByTestId("auth-error-message")).toContainText("Неверный email или пароль");
    await expect(page).toHaveURL(/\/login/);
  });

  test("выход из системы", async ({ page }) => {
    await mockAuthSignIn(page, true);
    await mockAuthSession(page, {
      email: testData.doctor.email,
      fullName: testData.doctor.fullName,
    });

    await loginAsDoctor(page, testData.doctor.email, testData.doctor.password);
    await expect(page).toHaveURL(/\/app/);

    await logoutFromShell(page);
    await expect(page).toHaveURL(/\/landing/);
  });

  test("администратор видит пункт Admin, обычный врач — нет", async ({ page }) => {
    await page.goto("/demo/roles?role=admin");
    await expect(page.getByTestId("nav-admin")).toBeVisible();

    await page.goto("/demo/roles?role=doctor");
    await expect(page.getByTestId("nav-admin")).toHaveCount(0);
    await expect(page.getByTestId("nav-app")).toBeVisible();
  });
});
