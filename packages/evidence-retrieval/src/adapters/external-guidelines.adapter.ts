import seedData from "../../data/external-guidelines.seed.json";

import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceProviderId, EvidenceSearchQuery, ExternalGuidelineRecord } from "../types.js";
import { adapterResult, limitRecords, type AdapterContext, type EvidenceAdapter } from "./types.js";

const SEED_ROWS: ExternalGuidelineRecord[] = seedData.map((row) => ({
  source: row.source as ExternalGuidelineRecord["source"],
  externalId: row.externalId,
  title: row.title,
  url: row.url,
  summary: row.summary,
  year: row.year,
}));

function allExternal(ctx: AdapterContext): ExternalGuidelineRecord[] {
  const fromConfig = ctx.config.externalGuidelines ?? [];
  const seen = new Set<string>();
  const merged: ExternalGuidelineRecord[] = [];
  for (const row of [...SEED_ROWS, ...fromConfig]) {
    const key = `${row.source}:${row.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

function scoreRow(row: ExternalGuidelineRecord, query: string): number {
  const q = query.toLowerCase();
  const hay = [row.title, row.summary ?? ""].join(" ").toLowerCase();
  if (hay.includes(q)) return 80;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hits += 1;
  }
  return (hits / tokens.length) * 60;
}

export function createExternalGuidelineAdapter(
  source: ExternalGuidelineRecord["source"],
  label: string,
): EvidenceAdapter {
  const providerId = source as EvidenceProviderId;
  const recordType = source === "ema" ? "drug_label" : "guideline";

  return {
    id: providerId,
    label,
    async search(query: EvidenceSearchQuery, ctx: AdapterContext) {
      const started = Date.now();
      const q = query.query.trim();
      if (!q) return adapterResult(providerId, [], 0, "skipped");

      const rows = allExternal(ctx)
        .filter((r) => r.source === source)
        .map((row) => ({ row, score: scoreRow(row, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

      const max = ctx.config.maxRecordsPerProvider ?? 8;
      const records = rows.slice(0, max).map(({ row, score }, index) =>
        buildEvidenceRecord({
          provider: providerId,
          sourceId: row.externalId,
          title: row.title,
          abstract: row.summary,
          year: row.year,
          url: row.url,
          recordType,
          relevanceScore: Math.min(1, score / 100 + 0.1 - index * 0.02),
        }),
      );

      return adapterResult(providerId, limitRecords(records, max), Date.now() - started);
    },
  };
}

export const whoAdapter = createExternalGuidelineAdapter("who", "WHO Guidelines");
export const niceAdapter = createExternalGuidelineAdapter("nice", "NICE Guidelines");
export const emaAdapter = createExternalGuidelineAdapter("ema", "EMA Medicines");
