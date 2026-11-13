import {
  CLINICAL_GUIDELINES,
  getGuidelineById,
  searchGuidelinesRanked,
} from "@repo/clinical-guidelines";

import { pickGuidelineCitation } from "../guideline-citation.js";
import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

/**
 * RCOG Green-top cards from @repo/clinical-guidelines (issuer=rcog).
 * Metadata + short US bullets only — no PDF body.
 */
export const rcogAdapter: EvidenceAdapter = {
  id: "rcog",
  label: "RCOG Green-top",

  async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("rcog", [], 0, "skipped");

    const max = ctx.config.maxRecordsPerProvider ?? 12;
    const hits = searchGuidelinesRanked(CLINICAL_GUIDELINES, q, max, {
      issuers: ["rcog"],
      activeOnly: true,
    });

    const records = hits
      .map((hit, index) => {
        const g = getGuidelineById(hit.id);
        if (!g) return null;
        const { section, quote } = pickGuidelineCitation(g, q);
        return buildEvidenceRecord({
          provider: "rcog",
          sourceId: g.id,
          title: g.title,
          abstract: g.summary,
          year: g.year,
          url: g.officialUrl || "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/",
          recordType: "guideline",
          relevanceScore: Math.min(1, hit.score / 100 + 0.2 - index * 0.02),
          section,
          quote,
          guidelineShelf: g.shelf,
          language: "en",
        });
      })
      .filter(Boolean) as ReturnType<typeof buildEvidenceRecord>[];

    return adapterResult("rcog", limitRecords(records, max), Date.now() - started);
  },
};
