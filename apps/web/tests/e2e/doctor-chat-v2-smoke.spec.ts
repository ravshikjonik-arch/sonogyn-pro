import { expect, test } from "@playwright/test";

/**
 * Soft smoke: doctor community chat shell (guest + health rollout).
 * Full send/realtime requires auth + DOCTOR_CHAT_V2_ENABLED on server.
 */
test.describe("Doctor chat v2 smoke", () => {
  test("guest /cases?tab=chat loads community hub", async ({ page }) => {
    await page.goto("/cases?tab=chat", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Чат врачей SonoGyn/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Чат врачей/i })).toBeVisible();
  });

  test("public health hides infrastructure details", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    for (const key of ["commit", "checks", "db", "rollout", "observability", "stage3"]) {
      expect(body).not.toHaveProperty(key);
    }
  });

  test("health exposes rollout.doctorChatV2 flag with token", async ({ request }) => {
    const token = process.env.HEALTH_DETAILS_TOKEN?.trim();
    test.skip(!token, "HEALTH_DETAILS_TOKEN not set");
    const res = await request.get("/api/health", { headers: { "x-health-token": token! } });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      rollout?: { doctorChatV2?: boolean };
    };
    expect(typeof body.rollout?.doctorChatV2).toBe("boolean");
  });

  test("messenger API gated when v2 off", async ({ request }) => {
    const res = await request.get(
      "/api/messenger/messages?chatId=00000000-0000-4000-8000-000000000001&limit=1",
    );
    expect([401, 404]).toContain(res.status());
  });
});
