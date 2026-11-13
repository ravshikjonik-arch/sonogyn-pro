/**
 * P3 soft eval: golden prompts + evidence answer validator (no live LLM).
 * Run from apps/web: node --import tsx scripts/evidence-p3-structural-eval.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { synthesizeEvidenceAnswer } from "@repo/evidence-retrieval";

import {
  formatEvidenceSourcedChatReply,
  postValidateEvidenceAnswer,
} from "../lib/ai/sonogyn-chat/evidence-answer-validate";
import { classificationVersionHintsForQuery } from "../lib/ai/sonogyn-chat/evidence-context";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const goldenPath = join(root, "packages/evidence-retrieval/eval/golden-prompts.json");
const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as {
  cases: Array<{
    id: string;
    domain?: string;
    prompt: string;
    expect?: Record<string, unknown>;
  }>;
};

assert.ok(Array.isArray(golden.cases) && golden.cases.length >= 15, "need ≥15 golden cases");

const byDomain: Record<string, number> = {
  obstetrics: 0,
  gynecology: 0,
  ultrasound: 0,
  safety: 0,
  other: 0,
};
let failed = 0;

for (const c of golden.cases) {
  const domain = c.domain || "other";
  byDomain[domain] = (byDomain[domain] ?? 0) + 1;

  const emptySearch = {
    query: c.prompt,
    records: [],
    providers: [{ provider: "static_corpus" as const, status: "ok" as const, records: [], latencyMs: 0 }],
    totalBeforeDedup: 0,
    searchedAt: new Date().toISOString(),
  };
  const answer = synthesizeEvidenceAnswer(c.prompt, emptySearch, { corpusMode: "all" });

  const text = formatEvidenceSourcedChatReply(answer);
  const v = postValidateEvidenceAnswer(text, answer);
  if (!v.ok && !v.replaced) {
    console.error("FAIL validate", c.id, v.reasons);
    failed += 1;
    continue;
  }

  const poisoned = postValidateEvidenceAnswer(`${text}\nPMID 99999999`, answer);
  if (poisoned.ok) {
    console.error("FAIL did-not-catch-pmid", c.id);
    failed += 1;
    continue;
  }

  const hint = c.expect?.classificationHint;
  if (typeof hint === "string") {
    const hints = classificationVersionHintsForQuery(c.prompt);
    const hit = hints.some((h) => h.toLowerCase().includes(hint.toLowerCase()));
    if (!hit && hints.length === 0) {
      console.log("warn classification-hint-miss", c.id);
    }
  }

  if (c.expect?.rejectUngroundedDiagnosis && answer.citations.length === 0) {
    if (!/недостаточно|insufficient|CDS|не диагноз|не является диагнозом/i.test(text)) {
      console.error("FAIL safety-disclaimer", c.id);
      failed += 1;
      continue;
    }
  }

  console.log("ok", domain, c.id);
}

console.log("domains", byDomain);
if (failed > 0) {
  console.error(`P3 structural failed: ${failed}`);
  process.exit(1);
}
console.log(`P3 structural passed (${golden.cases.length} cases)`);
