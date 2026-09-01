import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";
import {
  loginAsDoctor,
  logoutFromShell,
  mockAuthSession,
  mockAuthSignIn,
  mockAuthSignOut,
} from "./helpers/mock-backend";

const useServerAuthStub = Boolean(process.env.CI);

async function installAuthMocks(
  page: Parameters<typeof mockAuthSignIn>[0],
  options: {
    signInOk: boolean;
    user: { email: string; fullName: string; role?: string } | null;
  },
) {
  if (useServerAuthStub) return;
  await mockAuthSignIn(page, options.signInOk);
  await mockAuthSession(page, options.user);
}

test.describe("Авторизация врача", () => {
  test.beforeEach(async ({ page }) => {
    if (useServerAuthStub) return;
    await mockAuthSignOut(page);
  });

  test("успешный вход и редирект на рабочий стол", async ({ page }) => {
    await installAuthMocks(page, {
      signInOk: true,
      user: {
        email: testData.doctor.email,
        fullName: testData.doctor.fullName,
      },
    });

    await loginAsDoctor(page, testData.doctor.email, testData.doctor.password);

    await expect(page).toHaveURL(/\/(home|app)/);
    await expect(page.getByTestId("app-home")).toBeVisible();
  });

  test("неудачный вход с неверным паролем", async ({ page }) => {
    await installAuthMocks(page, { signInOk: false, user: null });

    await loginAsDoctor(page, testData.doctor.email, "wrong-password");

    await expect(page.getByTestId("auth-error-message")).toContainText("Неверный email или пароль");
    await expect(page).toHaveURL(/\/login/);
  });

  test("выход из системы", async ({ page }) => {
    await installAuthMocks(page, {
      signInOk: true,
      user: {
        email: testData.doctor.email,
        fullName: testData.doctor.fullName,
      },
    });

    await loginAsDoctor(page, testData.doctor.email, testData.doctor.password);
    await expect(page).toHaveURL(/\/(home|app)/);

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
