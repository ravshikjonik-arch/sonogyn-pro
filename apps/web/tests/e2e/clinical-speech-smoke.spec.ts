import { expect, test } from "@playwright/test";

/** Гинекологический консультант — всегда виден ClinicalAssistStrip + DictationField */
const SPEECH_ROUTE = "/ai/consultants/gynecology";

test.describe("Clinical speech smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/ai/speech/transcribe", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ available: false, maxBytes: 5_242_880 }),
        });
        return;
      }
      await route.fulfill({ status: 401, body: JSON.stringify({ error: "unauthorized" }) });
    });
  });

  test("GET consultants page returns 200", async ({ request }) => {
    const res = await request.get(SPEECH_ROUTE);
    expect(res.status()).toBe(200);
  });

  test("dictation field renders with mic control", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(SPEECH_ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-e2e-clinical-shell]")).toBeVisible({ timeout: 30_000 });

    const dictation = page.locator('[data-e2e="dictation-field"]').first();
    await expect(dictation).toBeVisible({ timeout: 45_000 });
    await expect(dictation.getByRole("button", { name: /Диктовка/i })).toBeVisible();
    await expect(dictation.getByRole("textbox", { name: /диктовки/i })).toBeVisible();

    await dictation.getByRole("textbox").fill("киста 40 мм гладкие контуры");
    await expect(dictation.getByRole("textbox")).toHaveValue(/киста 40 мм/);
  });
});
