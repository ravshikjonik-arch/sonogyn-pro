import { EVIDENCE_ENTRIES } from "@repo/evidence-corpus";
import { searchEvidence } from "@repo/evidence-engine";

import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

export const staticCorpusAdapter: EvidenceAdapter = {
  id: "static_corpus",
  label: "SonoEvidence",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("static_corpus", [], 0, "skipped");

    const max = ctx.config.maxRecordsPerProvider ?? 15;
    const hits = searchEvidence(EVIDENCE_ENTRIES, q, { limit: max });

    const records = hits.map((hit, index) =>
      buildEvidenceRecord({
        provider: "static_corpus",
        sourceId: hit.entry.id,
        title: hit.entry.title,
        abstract: hit.entry.summary,
        year: hit.entry.source.year,
        pmid: hit.entry.source.pmid,
        url: hit.entry.source.url || (hit.entry.source.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${hit.entry.source.pmid}/` : "#"),
        recordType: hit.entry.tier === 1 ? "guideline" : hit.entry.tier === 2 ? "review" : "consensus",
        relevanceScore: Math.min(1, hit.score / 40 + 0.15 - index * 0.02),
      }),
    );

    return adapterResult("static_corpus", limitRecords(records, max), Date.now() - started);
  },
};
