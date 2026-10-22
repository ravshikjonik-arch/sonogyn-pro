import { expect, test } from "@playwright/test";

/**
 * Контракт API доверия/репутации (mock). Полная интеграция — staging + миграции trust.
 */
test.describe("trust & reputation API smoke", () => {
  test("vote rejects unverified doctor (mocked 403)", async ({ page }) => {
    await page.route("**/api/cases/*/vote", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Голосовать могут только врачи с подтверждённым статусом (✓).",
        }),
      });
    });

    const res = await page.request.post("/api/cases/00000000-0000-4000-8000-000000000001/vote", {
      data: { vote: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test("featured awards via POST (mocked 200)", async ({ page }) => {
    await page.route("**/api/cases/*/featured", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const res = await page.request.post("/api/cases/00000000-0000-4000-8000-000000000001/featured");
    expect(res.status()).toBe(200);
  });

  test("reputation penalty requires body (mocked 400)", async ({ page }) => {
    await page.route("**/api/admin/reputation/penalty", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid" }),
      });
    });

    const res = await page.request.post("/api/admin/reputation/penalty", { data: {} });
    expect(res.status()).toBe(400);
  });
});
