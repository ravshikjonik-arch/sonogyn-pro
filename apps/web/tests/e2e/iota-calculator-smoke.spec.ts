import { expect, test } from "@playwright/test";

/**
 * Smoke: route is registered and SSR shell responds (clinical layout may hydrate async in dev).
 * Full ADNEX interaction — unit tests in @repo/iota-models + manual smoke.
 */
test.describe("IOTA calculator smoke", () => {
  test("GET /tools/calc/rads/iota returns 200 HTML", async ({ request }) => {
    const res = await request.get("/tools/calc/rads/iota");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("html");
    expect(html).toMatch(/ADNEX|IOTA/i);
  });
});
