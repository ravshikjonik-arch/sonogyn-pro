import { expect, test } from "@playwright/test";

const BRAIN_PAGE = "/ai/consultants/brain";
const BRAIN_API = "/api/ai/brain";

test.describe("Clinical brain smoke", () => {
  test("GET brain page returns 200 with assistant copy", async ({ request }) => {
    const res = await request.get(BRAIN_PAGE);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/ИИ-ассистент|клиническ/i);
    expect(html).toMatch(/Локальный|ЛОКАЛЬНО/i);
  });

  test("GET /api/ai/brain returns model metadata", async ({ request }) => {
    const res = await request.get(BRAIN_API);
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { model?: string; ollama?: boolean };
    expect(typeof json.model).toBe("string");
    expect(json.model!.length).toBeGreaterThan(0);
    expect(typeof json.ollama).toBe("boolean");
  });

  test("POST local mode returns calculate reply for CRL prompt", async ({ request }) => {
    const res = await request.post(BRAIN_API, {
      data: { text: "КТР 63", mode: "local" },
    });
    expect(res.status()).toBe(200);
    const json = (await res.json()) as {
      reply?: string;
      intent?: string;
      engine?: string;
      contract?: { disclaimer?: string };
    };
    expect(json.intent).toBe("calculate");
    expect(json.engine).toBe("engines");
    expect(json.reply?.length).toBeGreaterThan(10);
    expect(json.contract?.disclaimer?.length).toBeGreaterThan(5);
  });
});