import { expect, test } from "@playwright/test";

const EVIDENCE_PAGE = "/tools/refs/evidence-assistant";
const ASK_ROUTE = "/api/evidence/assistant/ask";

test.describe("Evidence Assistant smoke", () => {
  test("GET evidence-assistant page returns 200 HTML", async ({ request }) => {
    const res = await request.get(EVIDENCE_PAGE);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/Evidence Assistant/i);
  });

  test("POST ask returns answer without login (open-access E2E)", async ({ request }) => {
    const res = await request.post(ASK_ROUTE, {
      data: {
        query: "O-RADS 3 тактика наблюдения",
        corpusMode: "rf_kr",
        useLlm: false,
      },
    });
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { summary?: string; citations?: unknown[] };
    expect(json.summary?.length).toBeGreaterThan(20);
    expect(Array.isArray(json.citations)).toBe(true);
  });
});
