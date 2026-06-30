import type { EvidenceRecord } from "./types.js";
import { normalizeTitle } from "./normalizer.js";

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.95;
  const aw = new Set(na.split(" "));
  const bw = new Set(nb.split(" "));
  let inter = 0;
  for (const w of aw) {
    if (bw.has(w)) inter += 1;
  }
  return inter / Math.max(aw.size, bw.size);
}

function pickBetter(a: EvidenceRecord, b: EvidenceRecord): EvidenceRecord {
  const score = (r: EvidenceRecord) =>
    (r.abstract ? 2 : 0) +
    (r.doi ? 1 : 0) +
    (r.pmid ? 1 : 0) +
    (r.year ?? 0) / 10000 +
    r.relevanceScore;
  return score(a) >= score(b) ? a : b;
}

/** Merge duplicate records by PMID, DOI, or fuzzy title+year. */
export function dedupeEvidenceRecords(records: EvidenceRecord[]): EvidenceRecord[] {
  const byKey = new Map<string, EvidenceRecord>();

  for (const record of records) {
    const keys: string[] = [];
    if (record.pmid) keys.push(`pmid:${record.pmid}`);
    if (record.doi) keys.push(`doi:${record.doi.toLowerCase()}`);
    keys.push(`id:${record.id}`);

    let merged = record;
    for (const key of keys) {
      const existing = byKey.get(key);
      if (existing) merged = pickBetter(existing, merged);
    }

    for (const key of keys) {
      byKey.set(key, merged);
    }
  }

  const unique = new Map<string, EvidenceRecord>();
  for (const record of byKey.values()) {
    unique.set(record.id, record);
  }

  const list = [...unique.values()];
  const dropped = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    if (dropped.has(list[i]!.id)) continue;
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      if (dropped.has(b.id)) continue;
      if (a.pmid && b.pmid && a.pmid === b.pmid) {
        dropped.add(b.id);
        continue;
      }
      if (a.doi && b.doi && a.doi.toLowerCase() === b.doi.toLowerCase()) {
        dropped.add(b.id);
        continue;
      }
      const sim = titleSimilarity(a.title, b.title);
      if (sim >= 0.92 && (a.year === b.year || !a.year || !b.year)) {
        const keep = pickBetter(a, b);
        dropped.add(keep.id === a.id ? b.id : a.id);
      }
    }
  }

  return list.filter((r) => !dropped.has(r.id));
}
