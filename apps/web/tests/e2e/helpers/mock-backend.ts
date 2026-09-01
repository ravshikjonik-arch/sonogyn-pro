import type { Page, Route } from "@playwright/test";

import testData from "../../../lib/e2e/fixtures/test-data.json";

/** MSW-style мок бэкенда через Playwright route (пока EMR API не в production). */
export async function installEmrMockBackend(page: Page) {
  const handlers: Array<{ pattern: string | RegExp; handler: (route: Route) => Promise<void> }> = [
    {
      pattern: "**/api/e2e/schedule**",
      handler: async (route) => {
        const url = new URL(route.request().url());
        const day = url.searchParams.get("day") ?? "today";
        const slots =
          day === "tomorrow" ? testData.schedule.tomorrow : testData.schedule.today;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ day, slots }),
        });
      },
    },
    {
      pattern: "**/api/e2e/appointments**",
      handler: async (route) => {
        if (route.request().method() === "POST") {
          const body = route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: "appt-e2e-1",
              ...testData.appointment,
              ...body,
            }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ appointments: [testData.appointment] }),
        });
      },
    },
    {
      pattern: "**/api/e2e/prescriptions**",
      handler: async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({ id: "rx-e2e-1", ...testData.prescription }),
          });
          return;
        }
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      },
    },
    {
      pattern: "**/api/e2e/patients/*/record**",
      handler: async (route) => {
        if (route.request().method() === "PATCH") {
          if (route.request().headers()["if-match"] === "v1") {
            await route.fulfill({
              status: 409,
              contentType: "application/json",
              body: JSON.stringify({ error: "Conflict" }),
            });
            return;
          }
          const body = route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              diagnosis: body.diagnosis ?? testData.patient.diagnosis,
              notes: body.notes ?? testData.patient.notes,
            }),
          });
          return;
        }
        await route.continue();
      },
    },
  ];

  for (const { pattern, handler } of handlers) {
    await page.route(pattern, handler);
  }
}

export async function mockAuthSignIn(page: Page, ok: boolean) {
  await page.route("**/api/auth/sign-in", async (route) => {
    if (!ok) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Неверный email или пароль." }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
}

export async function mockAuthSession(
  page: Page,
  user: { email: string; fullName: string; role?: string } | null,
) {
  await page.route("**/api/auth/session", async (route) => {
    if (!user) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: null }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "e2e-user-id",
          email: user.email,
          user_metadata: { full_name: user.fullName },
          app_metadata: { role: user.role ?? "doctor" },
        },
      }),
    });
  });
}

export async function mockAuthSignOut(page: Page) {
  await page.route("**/api/auth/sign-out", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

export async function mockPatientsApi(page: Page) {
  const store: Array<{
    id: string;
    display_label: string;
    external_ref: string | null;
    meta?: { notes?: string; diagnosis?: string };
  }> = [];

  await page.route("**/api/patients**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());

    if (req.method() === "GET" && url.pathname.match(/\/api\/patients\/[^/]+$/)) {
      const id = url.pathname.split("/").pop();
      const hit = store.find((p) => p.id === id);
      await route.fulfill({
        status: hit ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify({ patient: hit ?? null }),
      });
      return;
    }

    if (req.method() === "GET") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const filtered = store.filter(
        (p) =>
          p.display_label.toLowerCase().includes(q) ||
          (p.external_ref ?? "").toLowerCase().includes(q),
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ patients: filtered, nextCursor: null, hasMore: false }),
      });
      return;
    }

    if (req.method() === "POST") {
      const body = req.postDataJSON() as {
        display_label: string;
        external_ref?: string;
        meta?: object;
      };
      const patient = {
        id: `patient-${Date.now()}`,
        display_label: body.display_label,
        external_ref: body.external_ref ?? null,
        meta: body.meta,
      };
      store.push(patient);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ patient }),
      });
      return;
    }

    if (req.method() === "PATCH") {
      const id = url.pathname.split("/").pop();
      const body = req.postDataJSON() as { meta?: { notes?: string; diagnosis?: string } };
      const hit = store.find((p) => p.id === id);
      if (hit && body.meta) hit.meta = { ...hit.meta, ...body.meta };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ patient: hit ?? null }),
      });
      return;
    }

    await route.continue();
  });

  return {
    seed() {
      store.length = 0;
      store.push({
        id: "patient-seed-1",
        display_label: testData.patient.displayLabel,
        external_ref: testData.patient.externalRef,
        meta: { notes: testData.patient.notes, diagnosis: testData.patient.diagnosis },
      });
    },
    clear() {
      store.length = 0;
    },
  };
}

export async function loginAsDoctor(page: Page, email: string, password: string) {
  await page.goto("/login?method=email");
  await page.getByRole("tab", { name: "Почта" }).click();
  const emailInput = page.getByTestId("email-input");
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-button").click();
}

export async function openUserMenu(page: Page) {
  await page.getByTestId("user-menu-trigger").click();
}

export async function logoutFromShell(page: Page) {
  await openUserMenu(page);
  await page.getByTestId("logout-button").click();
}
