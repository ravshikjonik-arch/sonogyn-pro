import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

/**
 * Epistemonikos: partner API often needs a key. Until configured we return
 * high-quality outbound search cards (metadata + link only).
 */
export const epistemonikosAdapter: EvidenceAdapter = {
  id: "epistemonikos",
  label: "Epistemonikos",

  async search(query: EvidenceSearchQuery, _ctx: AdapterContext) {
    const started = Date.now();
    const q = query.query.trim();
    if (!q) return adapterResult("epistemonikos", [], 0, "skipped");

    const records = [
      buildEvidenceRecord({
        provider: "epistemonikos",
        sourceId: `search:${q.slice(0, 80)}`,
        title: `Epistemonikos · систематические обзоры: «${q}»`,
        abstract:
          "Откройте Epistemonikos для связки systematic reviews с первичными исследованиями. Полные тексты — по условиям источника; мы храним только ссылку и метаданные.",
        url: `https://www.epistemonikos.org/en/documents?q=${encodeURIComponent(q)}&classification=systematic-review`,
        recordType: "systematic_review",
        relevanceScore: 0.72,
        quote: "Systematic reviews matrix",
        section: "Evidence matrix",
      }),
      buildEvidenceRecord({
        provider: "epistemonikos",
        sourceId: `broad:${q.slice(0, 80)}`,
        title: `Epistemonikos · широкий поиск: «${q}»`,
        abstract: "Все типы документов Epistemonikos по запросу.",
        url: `https://www.epistemonikos.org/en/documents?q=${encodeURIComponent(q)}`,
        recordType: "review",
        relevanceScore: 0.65,
      }),
    ];

    return adapterResult("epistemonikos", limitRecords(records, 4), Date.now() - started);
  },
};
