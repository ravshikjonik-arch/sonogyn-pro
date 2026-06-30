import { CLINICAL_GUIDELINES, getGuidelineById, searchGuidelinesRanked } from "@repo/clinical-guidelines";

import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

export const krMzRfAdapter: EvidenceAdapter = {
  id: "kr_mz_rf",
  label: "Клинические рекомендации РФ",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("kr_mz_rf", [], 0, "skipped");

    const max = ctx.config.maxRecordsPerProvider ?? 15;
    const hits = searchGuidelinesRanked(CLINICAL_GUIDELINES, q, max);

    const records = hits
      .map((hit, index) => {
        const g = getGuidelineById(hit.id);
        if (!g) return null;
        return buildEvidenceRecord({
          provider: "kr_mz_rf",
          sourceId: g.id,
          title: g.title,
          abstract: g.summary,
          year: g.year,
          url: g.officialUrl || `https://cr.minzdrav.gov.ru/`,
          recordType: "guideline",
          relevanceScore: Math.min(1, hit.score / 100 + 0.2 - index * 0.02),
        });
      })
      .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

    return adapterResult("kr_mz_rf", limitRecords(records, max), Date.now() - started);
  },
};
