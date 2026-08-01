/** Minimal guideline shape for section/quote citation (compatible with ClinicalGuideline). */
export type GuidelineCitationSource = {
  summary: string;
  sections?: { title: string; bullets: string[] }[];
};

/** Pick best matching section + bullet for IQDOC-style citation. */
export function pickGuidelineCitation(
  guideline: GuidelineCitationSource,
  query: string,
): { section?: string; quote?: string } {
  const q = query.trim().toLowerCase();
  const sections = guideline.sections ?? [];
  if (sections.length === 0) {
    return { quote: guideline.summary.slice(0, 280) || undefined };
  }

  let best = {
    section: sections[0]!.title,
    quote: sections[0]!.bullets[0] ?? guideline.summary,
    score: 0,
  };

  for (const section of sections) {
    const sectionHay = `${section.title} ${section.bullets.join(" ")}`.toLowerCase();
    let score = 0;
    if (q && sectionHay.includes(q)) score += 50;
    for (const token of q.split(/\s+/).filter((t) => t.length >= 3)) {
      if (sectionHay.includes(token)) score += 10;
      if (section.title.toLowerCase().includes(token)) score += 5;
    }
    let quote = section.bullets[0] ?? section.title;
    for (const bullet of section.bullets) {
      const b = bullet.toLowerCase();
      if (q && (b.includes(q) || q.split(/\s+/).some((t) => t.length >= 3 && b.includes(t)))) {
        quote = bullet;
        score += 8;
        break;
      }
    }
    if (score >= best.score) {
      best = { section: section.title, quote, score };
    }
  }

  return {
    section: best.section,
    quote: (best.quote || guideline.summary).slice(0, 320),
  };
}
