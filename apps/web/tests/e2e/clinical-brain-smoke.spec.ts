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
    const json = (await res.json()) as { model?: string; ollama?: boolean; evidenceCapable?: boolean };
    expect(typeof json.model).toBe("string");
    expect(json.model!.length).toBeGreaterThan(0);
    expect(typeof json.ollama).toBe("boolean");
    expect(json.evidenceCapable).toBe(true);
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

  test("POST with evidence enriches guideline-style prompt", async ({ request }) => {
    test.setTimeout(120_000);
    const res = await request.post(BRAIN_API, {
      data: { text: "порог NT 3.5 тактика скрининг", mode: "local", evidence: true },
    });
    expect(res.status()).toBe(200);
    const json = (await res.json()) as {
      reply?: string;
      engine?: string;
      evidence?: { citationCount?: number; tier?: string } | null;
    };
    expect(json.engine).toMatch(/evidence/);
    expect(json.reply?.length).toBeGreaterThan(20);
    if (json.evidence) {
      expect(typeof json.evidence.citationCount).toBe("number");
      expect(["full", "registry"]).toContain(json.evidence.tier);
    }
  });

  test("POST evidence registry tier on calculate with FIGO keyword", async ({ request }) => {
    test.setTimeout(60_000);
    const res = await request.post(BRAIN_API, {
      data: { text: "КТР 63 миома FIGO", mode: "local", evidence: true },
    });
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { intent?: string; evidence?: { tier?: string } };
    expect(json.intent).toBe("calculate");
    expect(json.evidence?.tier).toBe("registry");
  });
});