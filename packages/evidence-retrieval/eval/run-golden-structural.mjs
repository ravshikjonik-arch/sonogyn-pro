#!/usr/bin/env node
/**
 * Soft CI: validate golden-prompts.json + run synthesizeEvidenceAnswer structural gates.
 * No paid LLM calls.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertClaimsConsistent, synthesizeEvidenceAnswer } from "../src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(__dirname, "golden-prompts.json"), "utf8"));

assert.ok(Array.isArray(golden.cases) && golden.cases.length >= 15, "need ≥15 golden cases");

let failed = 0;
for (const c of golden.cases) {
  const emptySearch = {
    query: c.prompt,
    records: [],
    providers: [{ provider: "static_corpus", status: "ok", records: [], latencyMs: 0 }],
    totalBeforeDedup: 0,
    searchedAt: new Date().toISOString(),
  };
  const answer = synthesizeEvidenceAnswer(c.prompt, emptySearch, { corpusMode: "all" });
  const check = assertClaimsConsistent(answer);
  if (!check.ok) {
    console.error("FAIL claims", c.id, check.errors);
    failed += 1;
    continue;
  }
  if (c.expect?.insufficientPreferred || c.expect?.minCitationsOrInsufficient) {
    if (!(answer.insufficient || answer.citations.length >= 1)) {
      console.error("FAIL insufficient-or-cite", c.id);
      failed += 1;
      continue;
    }
  }
  if (c.expect?.mustNotInventPmid) {
    // Honest empty retrieval may echo the user query in summary — that is not an invented citation.
    if (answer.insufficient && answer.citations.length === 0) {
      // pass
    } else {
      const inventedInCitations = (answer.citations ?? []).some(
        (row) => String(row.pmid ?? "") === "99999999",
      );
      const inventedInClaims = JSON.stringify(answer.claims ?? []).includes("99999999");
      if (inventedInCitations || inventedInClaims) {
        console.error("FAIL invented pmid", c.id);
        failed += 1;
        continue;
      }
    }
  }
  console.log("ok", c.id);
}

if (failed > 0) {
  console.error(`golden structural failed: ${failed}`);
  process.exit(1);
}
console.log(`golden structural passed (${golden.cases.length} cases, empty-retrieval path)`);
