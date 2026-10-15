import { normSearchQuery } from "@repo/clinical-tools";

import { QUIZ_HUB_ENTRIES, type QuizHubEntry } from "@/lib/education/quiz-hub-registry";

export type QuizSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

function entryToHit(entry: QuizHubEntry): Omit<QuizSearchHit, "score"> {
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    href: entry.href,
  };
}

function scoreField(haystack: string, query: string): number {
  if (!query) return 0;
  if (haystack === query) return 100;
  if (haystack.startsWith(query)) return 80;
  if (haystack.includes(query)) return 50;
  return 0;
}

export function searchQuizLocal(rawQuery: string, limit = 5): QuizSearchHit[] {
  const query = normSearchQuery(rawQuery);
  const indexable = QUIZ_HUB_ENTRIES.filter((e) => e.id !== "quiz-hub-meta");

  const scored = indexable.map((entry) => {
    const blob = normSearchQuery(
      [entry.title, entry.subtitle, entry.topics.join(" "), entry.sourceLabel ?? ""].join(" "),
    );
    let score = scoreField(blob, query);
    if (!query) score = 4;
    return { ...entryToHit(entry), score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
