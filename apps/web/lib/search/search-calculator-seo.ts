import { normSearchQuery } from "@repo/clinical-tools";

import { CALCULATOR_SEO_REGISTRY, type CalculatorSeoEntry } from "@/lib/seo/calculator-seo-registry";

export type CalculatorSeoSearchHit = {
  id: string;
  title: string;
  description: string;
  href: string;
  score: number;
};

function scoreBlob(blob: string, query: string): number {
  if (!query) return 0;
  if (blob === query) return 100;
  if (blob.startsWith(query)) return 85;
  if (blob.includes(query)) return 55;
  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((p) => blob.includes(p))) return 50;
  return 0;
}

function entryBlob(entry: CalculatorSeoEntry): string {
  return normSearchQuery([entry.title, entry.description, ...entry.keywords].join(" "));
}

export function searchCalculatorSeo(rawQuery: string, limit = 10): CalculatorSeoSearchHit[] {
  const query = normSearchQuery(rawQuery);
  const scored: CalculatorSeoSearchHit[] = [];

  for (const entry of CALCULATOR_SEO_REGISTRY) {
    const blob = entryBlob(entry);
    let score = scoreBlob(blob, query);
    if (!query) {
      score =
        entry.path.includes("/tools/calc/rads/o-rads") ||
        entry.path.includes("/tools/calc/appointment") ||
        entry.path.includes("/ai/consultants/fmf")
          ? 12
          : entry.path.includes("/tools/calc/ob/")
            ? 9
            : 6;
    }
    if (score <= 0) continue;
    scored.push({
      id: entry.path,
      title: entry.title.replace(/\s·\sонлайн$/i, "").replace(/\sонлайн$/i, ""),
      description: entry.description,
      href: entry.path,
      score,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
