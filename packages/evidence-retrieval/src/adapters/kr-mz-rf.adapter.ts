import {
  CLINICAL_GUIDELINES,
  getGuidelineById,
  searchGuidelinesRanked,
  type GuidelineShelf,
} from "@repo/clinical-guidelines";

import { shelvesForCorpusMode } from "../corpus-mode.js";
import { pickGuidelineCitation } from "../guideline-citation.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

export { pickGuidelineCitation } from "../guideline-citation.js";

export const krMzRfAdapter: EvidenceAdapter = {
  id: "kr_mz_rf",
  label: "Клинические рекомендации РФ",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("kr_mz_rf", [], 0, "skipped");

    const max = ctx.config.maxRecordsPerProvider ?? 15;
    const shelves = shelvesForCorpusMode(query.corpusMode) as GuidelineShelf[] | undefined;
    const hits = searchGuidelinesRanked(CLINICAL_GUIDELINES, q, max, {
      shelves,
      activeOnly: true,
    });

    const records = hits
      .map((hit, index) => {
        const g = getGuidelineById(hit.id);
        if (!g) return null;
        const { section, quote } = pickGuidelineCitation(g, q);
        return buildEvidenceRecord({
          provider: "kr_mz_rf",
          sourceId: g.id,
          title: g.title,
          abstract: g.summary,
          year: g.year,
          url: g.officialUrl || `https://cr.minzdrav.gov.ru/`,
          recordType: "guideline",
          relevanceScore: Math.min(1, hit.score / 100 + 0.2 - index * 0.02),
          section,
          quote,
          guidelineShelf: g.shelf,
        });
      })
      .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

    return adapterResult("kr_mz_rf", limitRecords(records, max), Date.now() - started);
  },
};
