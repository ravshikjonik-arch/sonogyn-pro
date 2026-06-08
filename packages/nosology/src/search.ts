import type { Nosology, NosologySearchHit } from "./types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function scoreField(text: string, q: string): number {
  const n = norm(text);
  if (!n) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 50;
  return 0;
}

/** Мгновенный поиск по названию, ключевым словам и описанию */
export function searchNosologies(items: Nosology[], query: string, limit = 40): NosologySearchHit[] {
  const q = norm(query);
  if (!q) {
    return items.slice(0, limit).map((n) => ({
      id: n.id,
      title: n.title,
      zone: n.zone,
      snippet: n.description.slice(0, 120),
      score: 1,
    }));
  }

  const hits: NosologySearchHit[] = [];
  for (const n of items) {
    let score =
      scoreField(n.title, q) * 2 +
      scoreField(n.description, q) +
      n.keywords.reduce((s, k) => s + scoreField(k, q), 0) +
      (n.icd10 ? scoreField(n.icd10, q) : 0);

    if (score > 0) {
      hits.push({
        id: n.id,
        title: n.title,
        zone: n.zone,
        snippet: n.description.slice(0, 140),
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
