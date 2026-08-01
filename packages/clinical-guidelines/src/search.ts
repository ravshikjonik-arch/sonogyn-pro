import type {
  ClinicalGuideline,
  GuidelineSearchHit,
  GuidelineShelf,
  GuidelineShelfFilter,
  GuidelineSpecialtyFilter,
} from "./types";

function scoreMatch(haystack: string, query: string): number {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase();
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 50;
  return 0;
}

export function searchGuidelines(
  items: ClinicalGuideline[],
  query: string,
  options?: {
    specialty?: GuidelineSpecialtyFilter;
    shelf?: GuidelineShelfFilter;
    activeOnly?: boolean;
  },
): ClinicalGuideline[] {
  const q = query.trim();
  const specialty = options?.specialty ?? "all";
  const shelf = options?.shelf ?? "all";
  const activeOnly = options?.activeOnly ?? false;

  return items
    .filter((g) => {
      if (activeOnly && g.status !== "active") return false;
      if (specialty !== "all" && g.specialty !== specialty) return false;
      if (shelf !== "all" && g.shelf !== shelf) return false;
      if (!q) return true;
      const hay = [
        g.title,
        g.summary,
        g.documentNumber ?? "",
        ...(g.tags ?? []),
      ].join(" ");
      return hay.toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function searchGuidelinesRanked(
  items: ClinicalGuideline[],
  query: string,
  limit = 20,
  options?: {
    shelves?: GuidelineShelf[];
    activeOnly?: boolean;
  },
): GuidelineSearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const shelfSet = options?.shelves?.length ? new Set(options.shelves) : null;
  const activeOnly = options?.activeOnly ?? false;
  const hits: GuidelineSearchHit[] = [];

  for (const g of items) {
    if (shelfSet && !shelfSet.has(g.shelf)) continue;
    if (activeOnly && g.status !== "active") continue;

    const sectionBlob =
      g.sections?.flatMap((s) => [s.title, ...s.bullets]).join(" ") ?? "";
    const hay = [g.title, g.summary, sectionBlob, ...(g.tags ?? [])].join(" ");
    let score = scoreMatch(hay, q);
    // Token fallback: score partial clinical queries (e.g. "миома УЗИ")
    if (score <= 0) {
      const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
      let tokenHits = 0;
      for (const t of tokens) {
        if (hay.toLowerCase().includes(t)) tokenHits += 1;
      }
      if (tokenHits === 0) continue;
      score = Math.min(45, 15 * tokenHits);
    }
    hits.push({
      id: g.id,
      title: g.title,
      shelf: g.shelf,
      specialty: g.specialty,
      snippet: g.summary.slice(0, 160),
      score,
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function groupGuidelinesByShelf(
  items: ClinicalGuideline[],
  shelfOrder: GuidelineShelf[],
): { shelf: GuidelineShelf; items: ClinicalGuideline[] }[] {
  return shelfOrder
    .map((shelf) => ({
      shelf,
      items: items.filter((g) => g.shelf === shelf),
    }))
    .filter((group) => group.items.length > 0);
}
