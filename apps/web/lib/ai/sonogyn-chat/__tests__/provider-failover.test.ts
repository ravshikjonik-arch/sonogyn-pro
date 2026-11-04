import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildEvidenceModeSystemPrompt, formatEvidenceContextForPrompt } from "../evidence-context";
import type { AssistantAnswer } from "@repo/evidence-retrieval";
import {
  classifyProviderFailure,
  isNetworkFailureMessage,
  runSequentialProviderAttempts,
  shouldFailoverToNextProvider,
} from "../provider-failover";

describe("provider-failover classification", () => {
  it("treats ECONNREFUSED / network as retryable", () => {
    assert.equal(isNetworkFailureMessage("fetch failed: ECONNREFUSED 127.0.0.1:8000"), true);
    assert.equal(
      classifyProviderFailure({
        status: 503,
        code: "provider",
        bodyText: "connect ECONNREFUSED 127.0.0.1:8000",
      }),
      "retryable",
    );
    assert.equal(
      shouldFailoverToNextProvider({
        status: 503,
        code: "provider",
        bodyText: "ECONNREFUSED",
        hasNextProvider: true,
      }),
      true,
    );
  });

  it("treats timeout / 429 / 500 / 502 / 503 / 504 as retryable", () => {
    for (const status of [429, 500, 502, 503, 504]) {
      assert.equal(
        shouldFailoverToNextProvider({ status, hasNextProvider: true }),
        true,
        `status ${status}`,
      );
    }
    assert.equal(
      shouldFailoverToNextProvider({
        status: 504,
        code: "timeout",
        bodyText: "timeout",
        hasNextProvider: true,
      }),
      true,
    );
  });

  it("Colibri 401 → failover once (auth_config), not infinite", () => {
    assert.equal(classifyProviderFailure({ status: 401, code: "config" }), "auth_config");
    assert.equal(
      shouldFailoverToNextProvider({
        status: 401,
        code: "config",
        hasNextProvider: true,
      }),
      true,
    );
    assert.equal(
      shouldFailoverToNextProvider({
        status: 401,
        code: "config",
        hasNextProvider: false,
      }),
      false,
    );
  });

  it("invalid request → no failover", () => {
    assert.equal(
      shouldFailoverToNextProvider({
        status: 400,
        code: "invalid_request",
        hasNextProvider: true,
      }),
      false,
    );
  });

  it("PHI / security → no failover", () => {
    assert.equal(
      shouldFailoverToNextProvider({
        status: 400,
        code: "phi_detected",
        hasNextProvider: true,
      }),
      false,
    );
    assert.equal(
      shouldFailoverToNextProvider({
        status: 400,
        code: "prompt_injection",
        hasNextProvider: true,
      }),
      false,
    );
  });

  it("stream committed → no failover even if retryable", () => {
    assert.equal(
      shouldFailoverToNextProvider({
        status: 503,
        bodyText: "ECONNREFUSED",
        hasNextProvider: true,
        streamCommitted: true,
      }),
      false,
    );
  });
});

describe("runSequentialProviderAttempts (mock providers)", () => {
  it("1. Colibri unavailable → OpenRouter succeeds", async () => {
    const calls: string[] = [];
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        calls.push(p);
        if (p === "colibri") {
          return { ok: false, status: 503, code: "provider", bodyText: "ECONNREFUSED" };
        }
        return { ok: true, value: "hello from openrouter" };
      },
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.provider, "openrouter");
      assert.equal(res.usedFallback, true);
      assert.equal(res.value, "hello from openrouter");
    }
    assert.deepEqual(calls, ["colibri", "openrouter"]);
  });

  it("2. Colibri down → Perplexity when it is next (not skipped incorrectly)", async () => {
    const calls: string[] = [];
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "perplexity", "openrouter"],
      call: async (p) => {
        calls.push(p);
        if (p === "colibri") {
          return { ok: false, status: 503, bodyText: "ECONNREFUSED" };
        }
        if (p === "perplexity") return { ok: true, value: "sonar" };
        return { ok: true, value: "or" };
      },
    });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.provider, "perplexity");
    assert.deepEqual(calls, ["colibri", "perplexity"]);
  });

  it("3. Colibri timeout → fallback", async () => {
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        if (p === "colibri") return { ok: false, status: 504, code: "timeout", bodyText: "timeout" };
        return { ok: true, value: "ok" };
      },
    });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.provider, "openrouter");
  });

  it("4. Colibri ECONNREFUSED → fallback", async () => {
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        if (p === "colibri") {
          return { ok: false, status: 500, code: "unknown", bodyText: "connect ECONNREFUSED" };
        }
        return { ok: true, value: "ok" };
      },
    });
    assert.equal(res.ok, true);
  });

  it("5. Colibri 401 → one hop, not infinite", async () => {
    let colibriHits = 0;
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        if (p === "colibri") {
          colibriHits += 1;
          return { ok: false, status: 401, code: "config", bodyText: "unauthorized" };
        }
        return { ok: true, value: "cloud" };
      },
    });
    assert.equal(colibriHits, 1);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.provider, "openrouter");
  });

  it("6. all providers down → controlled error", async () => {
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async () => ({ ok: false, status: 503, bodyText: "down" }),
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(res.error, /all_providers_failed|openrouter:503/);
      assert.deepEqual(res.tried, ["colibri", "openrouter"]);
    }
  });

  it("7. invalid request → no failover", async () => {
    const calls: string[] = [];
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        calls.push(p);
        return { ok: false, status: 400, code: "invalid_request", bodyText: "bad" };
      },
    });
    assert.equal(res.ok, false);
    assert.deepEqual(calls, ["colibri"]);
  });

  it("8. PHI/security → no failover", async () => {
    const calls: string[] = [];
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        calls.push(p);
        return { ok: false, status: 400, code: "phi_detected" };
      },
    });
    assert.equal(res.ok, false);
    assert.deepEqual(calls, ["colibri"]);
  });

  it("9. streaming before first byte → failover allowed", async () => {
    assert.equal(
      shouldFailoverToNextProvider({
        status: 503,
        bodyText: "ECONNREFUSED",
        hasNextProvider: true,
        streamCommitted: false,
      }),
      true,
    );
  });

  it("10. streaming after first byte → no full retry", async () => {
    const calls: string[] = [];
    // Simulate: first provider "succeeds" and commits stream; later failure must not re-call.
    const res = await runSequentialProviderAttempts({
      providers: ["colibri", "openrouter"],
      call: async (p) => {
        calls.push(p);
        return { ok: true, value: `stream:${p}` };
      },
      onSuccessBeforeReturn: async () => {
        /* stream committed inside helper */
      },
    });
    assert.equal(res.ok, true);
    assert.deepEqual(calls, ["colibri"]);
    assert.equal(
      shouldFailoverToNextProvider({
        status: 503,
        hasNextProvider: true,
        streamCommitted: true,
      }),
      false,
    );
  });
});

describe("Evidence integrity across provider switch", () => {
  const sampleAnswer = {
    query: "O-RADS",
    summary: "Summary from retrieval",
    evidenceStrength: "moderate",
    gradeLabel: "умеренная",
    recommendations: ["Follow ACR O-RADS US v2022"],
    contraindications: [],
    alternatives: [],
    citations: [
      {
        id: "c1",
        title: "ACR O-RADS US",
        url: "https://example.org/orads",
        provider: "guideline",
        year: 2022,
        abstract: "Ovarian-Adnexal Reporting",
      },
    ],
    guidelines: [{ title: "ACR O-RADS", url: "https://example.org/orads", org: "ACR" }],
    disclaimers: ["CDS, не диагноз"],
    sourcesUsed: {},
    searchedAt: new Date().toISOString(),
    synthesisMode: "rules",
  } as AssistantAnswer;

  it("11. Evidence context preserved (same prompt for any provider)", () => {
    const ctx = formatEvidenceContextForPrompt(sampleAnswer);
    const promptA = buildEvidenceModeSystemPrompt(ctx, "O-RADS киста");
    const promptB = buildEvidenceModeSystemPrompt(ctx, "O-RADS киста");
    assert.equal(promptA, promptB);
    assert.match(promptA, /citations|Citations|ACR O-RADS/i);
    assert.match(promptA, /не диагноз|CDS/i);
  });

  it("12. citations / sources not dropped on failover (context independent of provider id)", () => {
    const ctx = formatEvidenceContextForPrompt(sampleAnswer);
    assert.match(ctx, /ACR O-RADS US/);
    assert.match(ctx, /https:\/\/example\.org\/orads/);
    // Failover only changes HTTP transport; system prompt built once before the loop.
    const forColibri = buildEvidenceModeSystemPrompt(ctx, "вопрос");
    const forOpenRouter = buildEvidenceModeSystemPrompt(ctx, "вопрос");
    assert.equal(forColibri, forOpenRouter);
    assert.ok(forOpenRouter.includes("ТОЛЬКО предоставленные citations"));
  });
});
