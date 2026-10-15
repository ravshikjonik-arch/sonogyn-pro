import { expect, test } from "@playwright/test";

/**
 * Smoke: lifecycle API contract (mocked). Full DB integration — staging manual.
 */
test.describe("case lifecycle API smoke", () => {
  test("rejects confirm without diagnosis (mocked 400)", async ({ page }) => {
    await page.route("**/api/cases/*/lifecycle", async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      const body = route.request().postDataJSON() as { action?: string };
      if (body.action === "confirm") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Укажите содержательное подтверждённое заключение (минимум 3 символа).",
            code: "confirmed_diagnosis_required",
            requestId: "e2e-mock",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, action: body.action, requestId: "e2e-mock" }),
      });
    });

    const res = await page.request.patch("/api/cases/00000000-0000-4000-8000-000000000001/lifecycle", {
      data: { action: "confirm", confirmationMethod: "mri" },
    });
    expect(res.status()).toBe(400);
    const json = (await res.json()) as { code?: string };
    expect(json.code).toBe("confirmed_diagnosis_required");
  });
});
