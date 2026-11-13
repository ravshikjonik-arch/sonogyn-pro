#!/usr/bin/env node
/**
 * Soft A/B: unified search with medical_vault on vs off (fixture search, no live LLM/DB).
 * Exit 0 always unless structural invariants break (CI-soft).
 */
import assert from "node:assert/strict";

import { searchEvidenceUnified } from "../src/index.ts";

const QUERY = "O-RADS 3 наблюдение кисты яичника";

const vaultHit = {
  chunkId: "ab-c1",
  sourceId: "ab-s1",
  title: "Vault: УЗИ придатков (fixture)",
  organization: "SonoGyn fixture",
  year: 2024,
  section: "O-RADS US",
  quote: "O-RADS 3: наблюдение по локальному протоколу при типичных признаках",
  url: "https://example.com/vault-fixture",
  score: 0.9,
};

async function run(label, config) {
  const result = await searchEvidenceUnified(
    {
      query: QUERY,
      limit: 10,
      providers: ["static_corpus", "medical_vault"],
    },
    {
      config: {
        adapterTimeoutMs: 2000,
        maxRecordsPerProvider: 8,
        enabledProviders: ["static_corpus", "medical_vault"],
        ...config,
      },
      enrichCrossref: false,
    },
  );
  const vaultStatus = result.providers.find((p) => p.provider === "medical_vault")?.status;
  const vaultCount = result.records.filter((r) => r.provider === "medical_vault").length;
  const topProviders = result.records.slice(0, 5).map((r) => r.provider);
  console.log(
    JSON.stringify({
      label,
      vaultStatus,
      vaultInTop: vaultCount,
      topProviders,
      total: result.records.length,
    }),
  );
  return { result, vaultStatus, vaultCount };
}

const off = await run("vault-off", {});
assert.equal(off.vaultStatus, "skipped");
assert.equal(off.vaultCount, 0);

const on = await run("vault-on", {
  medicalVaultSearch: async () => [vaultHit],
});
assert.equal(on.vaultStatus, "ok");
assert.ok(on.vaultCount >= 1, "vault-on must surface ≥1 medical_vault record");
assert.ok(
  on.result.records.some((r) => r.quote?.includes("O-RADS 3")),
  "vault quote must reach ranked records",
);

console.log(
  "hybrid A/B soft OK: vault-off skipped; vault-on contributes citations without replacing static_corpus channel",
);
