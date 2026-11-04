import seedData from "../../data/roszdravnadzor-seed.json";

import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type RzSeed = {
  id: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
};

const SEED = seedData as RzSeed[];

function scoreRow(row: RzSeed, query: string): number {
  const q = query.toLowerCase().replace(/ё/g, "е");
  const hay = [row.title, row.summary, ...row.tags].join(" ").toLowerCase();
  if (!q) return 40;
  if (hay.includes(q)) return 90;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  if (!tokens.length) return 30;
  let hits = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hits += 1;
  }
  return hits === 0 ? 20 : (hits / tokens.length) * 75;
}

export const roszdravnadzorAdapter: EvidenceAdapter = {
  id: "roszdravnadzor",
  label: "Росздравнадзор",

  async search(query: EvidenceSearchQuery, _ctx: AdapterContext) {
    const started = Date.now();
    const term = query.query.trim();

    const scored = SEED.map((row) => ({ row, score: scoreRow(row, term) })).sort(
      (a, b) => b.score - a.score,
    );

    const records = scored.map(({ row, score }, index) =>
      buildEvidenceRecord({
        provider: "roszdravnadzor",
        sourceId: row.id,
        title: row.title,
        abstract: row.summary,
        url: row.url,
        recordType: "other",
        language: "ru",
        relevanceScore: Math.min(0.95, score / 100 - index * 0.03),
        quote: row.tags.join(", "),
        section: "Официальные уведомления",
      }),
    );

    if (term) {
      records.unshift(
        buildEvidenceRecord({
          provider: "roszdravnadzor",
          sourceId: `news-search:${term.slice(0, 64)}`,
          title: `Росздравнадзор · поиск уведомлений «${term}»`,
          abstract:
            "Проверьте официальный сайт на отзывы серий и информационные письма. Мы не зеркалим полный HTML ведомства.",
          url: `https://www.roszdravnadzor.gov.ru/news`,
          recordType: "other",
          language: "ru",
          relevanceScore: 0.7,
        }),
      );
    }

    return adapterResult("roszdravnadzor", limitRecords(records, 6), Date.now() - started);
  },
};
