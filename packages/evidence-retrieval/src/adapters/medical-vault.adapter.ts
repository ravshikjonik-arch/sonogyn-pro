import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

/**
 * pgvector medical vault (ADR-VEC). Skips unless RetrievalConfig.medicalVaultSearch is wired.
 * Does not replace PubMed/KR adapters — additive hybrid channel.
 */
export const medicalVaultAdapter: EvidenceAdapter = {
  id: "medical_vault",
  label: "Medical Vault (pgvector)",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    const searchFn = ctx.config.medicalVaultSearch;
    if (!searchFn || !q) {
      return adapterResult("medical_vault", [], Date.now() - started, "skipped");
    }

    const max = ctx.config.maxRecordsPerProvider ?? 12;
    try {
      const hits = await searchFn({ query: q, limit: Math.min(max, 12) });
      const records = hits.map((hit, index) =>
        buildEvidenceRecord({
          provider: "medical_vault",
          sourceId: hit.sourceId,
          title: hit.title,
          abstract: hit.quote,
          year: hit.year,
          url: hit.url || "#",
          journal: hit.organization,
          recordType: "guideline",
          relevanceScore: Math.min(1, Math.max(0.15, hit.score) - index * 0.02),
          section: hit.section,
          quote: hit.quote.slice(0, 280),
        }),
      );
      return adapterResult("medical_vault", limitRecords(records, max), Date.now() - started);
    } catch (err) {
      const message = err instanceof Error ? err.message : "vault search failed";
      return adapterResult("medical_vault", [], Date.now() - started, "error", message);
    }
  },
};
