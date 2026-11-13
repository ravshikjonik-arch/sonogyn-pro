import seedData from "../../data/grls-seed.json";

import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceSearchQuery } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

type GrlsSeedRow = {
  inn: string;
  aliases: string[];
  note: string;
  pregnancyCaution: boolean;
};

const SEED = seedData as GrlsSeedRow[];

/** Official registry UI — no public bulk API; we expose metadata + deep link. */
export function grlsSearchUrl(innOrQuery: string): string {
  const q = innOrQuery.trim();
  return `https://grls.rosminzdrav.ru/Default.aspx?search=${encodeURIComponent(q)}`;
}

function scoreRow(row: GrlsSeedRow, query: string): number {
  const q = query.toLowerCase().replace(/ё/g, "е");
  const hay = [row.inn, ...row.aliases, row.note].join(" ").toLowerCase().replace(/ё/g, "е");
  if (hay.includes(q)) return 95;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  if (!tokens.length) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hits += 1;
  }
  return (hits / tokens.length) * 70;
}

export const grlsAdapter: EvidenceAdapter = {
  id: "grls",
  label: "ГРЛС (РФ)",

  async search(query: EvidenceSearchQuery, _ctx: AdapterContext) {
    const started = Date.now();
    const term = query.query.trim();
    if (!term) return adapterResult("grls", [], 0, "skipped");

    const scored = SEED.map((row) => ({ row, score: scoreRow(row, term) }))
      .filter((x) => x.score >= 25)
      .sort((a, b) => b.score - a.score);

    const records = scored.map(({ row, score }, index) =>
      buildEvidenceRecord({
        provider: "grls",
        sourceId: row.inn,
        title: `ГРЛС · ${row.inn}`,
        abstract: [
          row.note,
          row.pregnancyCaution ? "Внимание: уточняйте безопасность при беременности/лактации по инструкции и КР." : null,
          "Источник: Государственный реестр лекарственных средств. Полный текст инструкции — на сайте ГРЛС.",
        ]
          .filter(Boolean)
          .join(" "),
        url: grlsSearchUrl(row.inn),
        recordType: "drug_label",
        language: "ru",
        relevanceScore: Math.min(0.98, score / 100 - index * 0.02),
        quote: row.note,
        section: "Реестр ЛС РФ",
      }),
    );

    // Always offer a registry search card even if seed miss.
    if (records.length === 0) {
      records.push(
        buildEvidenceRecord({
          provider: "grls",
          sourceId: `search:${term.slice(0, 64)}`,
          title: `ГРЛС · поиск «${term}»`,
          abstract:
            "Откройте официальный реестр и найдите препарат по МНН/торговому названию. Мы не копируем полные инструкции.",
          url: grlsSearchUrl(term),
          recordType: "drug_label",
          language: "ru",
          relevanceScore: 0.55,
        }),
      );
    }

    return adapterResult("grls", limitRecords(records, 8), Date.now() - started);
  },
};
