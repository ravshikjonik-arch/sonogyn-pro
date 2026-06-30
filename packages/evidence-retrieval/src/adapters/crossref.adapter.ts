import { buildEvidenceRecord } from "../normalizer.js";
import type { EvidenceRecord } from "../types.js";
import type { AdapterContext } from "./types.js";

/** Enrich records missing DOI via CrossRef (polite pool). */
export async function enrichRecordsWithCrossref(
  records: EvidenceRecord[],
  ctx: AdapterContext,
): Promise<EvidenceRecord[]> {
  const mailto = ctx.config.crossrefMailto?.trim() || "support@sonogyn.pro";
  const out: EvidenceRecord[] = [];

  for (const record of records) {
    if (record.doi || !record.title) {
      out.push(record);
      continue;
    }

    try {
      const params = new URLSearchParams({
        query: record.title.slice(0, 200),
        rows: "1",
        mailto,
      });
      const url = `https://api.crossref.org/works?${params.toString()}`;
      const res = await fetch(url, {
        headers: { "User-Agent": `SonoGynPro/1.0 (mailto:${mailto})` },
        signal: ctx.signal,
      });
      if (!res.ok) {
        out.push(record);
        continue;
      }

      const json = (await res.json()) as {
        message?: { items?: { DOI?: string; published?: { "date-parts"?: number[][] } }[] };
      };
      const item = json.message?.items?.[0];
      if (!item?.DOI) {
        out.push(record);
        continue;
      }

      const year = item.published?.["date-parts"]?.[0]?.[0];
      out.push({
        ...record,
        doi: item.DOI,
        year: record.year ?? year,
        id: record.pmid ? record.id : `crossref:${item.DOI}`,
      });
    } catch {
      out.push(record);
    }
  }

  return out;
}

export function crossrefAdapterStub() {
  return {
    id: "crossref" as const,
    label: "CrossRef",
    async search() {
      return {
        provider: "crossref" as const,
        status: "skipped" as const,
        records: [],
        latencyMs: 0,
        error: "CrossRef runs as DOI enrichment pass",
      };
    },
  };
}
