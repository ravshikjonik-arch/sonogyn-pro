import { CLINICAL_GUIDELINES, searchGuidelinesRanked } from "@repo/clinical-guidelines";

export type GuidelineLocalHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

export function searchGuidelinesLocal(rawQuery: string, limit = 6): GuidelineLocalHit[] {
  const q = rawQuery.trim();
  if (!q) {
    return CLINICAL_GUIDELINES.filter((g) => g.status === "active")
      .slice(0, limit)
      .map((g) => ({
        id: g.id,
        title: g.title,
        subtitle: g.summary.slice(0, 120),
        href: `/tools/refs/guidelines/${g.id}`,
        score: 3,
      }));
  }

  return searchGuidelinesRanked(CLINICAL_GUIDELINES, q, limit, { activeOnly: true }).map((h) => ({
    id: h.id,
    title: h.title,
    subtitle: h.snippet,
    href: `/tools/refs/guidelines/${h.id}`,
    score: h.score,
  }));
}
