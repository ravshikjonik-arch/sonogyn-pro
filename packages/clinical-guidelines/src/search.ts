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
): GuidelineSearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const hits: GuidelineSearchHit[] = [];

  for (const g of items) {
    const hay = [g.title, g.summary, ...(g.tags ?? [])].join(" ");
    const score = scoreMatch(hay, q);
    if (score <= 0) continue;
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
