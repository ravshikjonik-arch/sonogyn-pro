import { expect, test } from "@playwright/test";

/**
 * Wave 4.2: guest can open discussions feed; posting stays auth-gated (API).
 */
test.describe("Discussions guest smoke", () => {
  test("guest /cases?tab=chat loads hub", async ({ page }) => {
    await page.goto("/cases?tab=chat", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Чат врачей SonoGyn/i })).toBeVisible();
  });

  test("discussions feed mode reachable without login", async ({ page }) => {
    await page.goto("/cases?feedMode=discussions", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/feedMode=discussions/);
    await expect(page.getByRole("heading", { name: /Чат врачей SonoGyn/i })).toBeVisible();
  });

  test("posting case discussion requires auth", async ({ request }) => {
    const res = await request.post("/api/cases", {
      data: { title: "e2e-guest-gate", kind: "discussion" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403]).toContain(res.status());
  });
});