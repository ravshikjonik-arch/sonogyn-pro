/**
 * Формат ответа KB → движок / экран Неотложка · СМП.
 * Блоки: симптомы → анализы → действия → препараты → не делать → эскалация → источник.
 */

import type { CanonicalKnowledgeArticle, MedicalKnowledgeRetrieveResult } from "./types";

function sectionText(article: CanonicalKnowledgeArticle, type: string): string | null {
  const s = article.sections.find((x) => x.sectionType === type);
  return s?.content?.trim() ? s.content.trim() : null;
}

/** Симптомы: новый тип или legacy red_flags. */
function symptomsText(article: CanonicalKnowledgeArticle): string | null {
  return sectionText(article, "symptoms") ?? sectionText(article, "red_flags");
}

export function formatArticleForAssistant(article: CanonicalKnowledgeArticle): string {
  const parts: string[] = [`## ${article.title}`, article.summary];

  const symptoms = symptomsText(article);
  if (symptoms) parts.push(`### Симптомы / на что смотреть\n${symptoms}`);

  const diagnostics = sectionText(article, "diagnostics");
  if (diagnostics) parts.push(`### Анализы и обследования\n${diagnostics}`);

  const steps = sectionText(article, "action_steps");
  if (steps) parts.push(`### Что делать\n${steps}`);

  const meds = sectionText(article, "medications");
  if (meds) parts.push(`### Препараты (справочно)\n${meds}`);

  const doNot = sectionText(article, "do_not");
  if (doNot) parts.push(`### Чего не делать\n${doNot}`);

  const esc = sectionText(article, "escalation");
  if (esc) parts.push(`### Эскалация\n${esc}`);

  const edu = sectionText(article, "education");
  if (edu) parts.push(`### Источник и КР\n${edu}`);

  const src = article.sources[0];
  if (src && !edu) {
    const pages =
      src.pageStart != null
        ? src.pageEnd != null && src.pageEnd !== src.pageStart
          ? `стр. ${src.pageStart}–${src.pageEnd}`
          : `стр. ${src.pageStart}`
        : null;
    parts.push(
      `### Источник\n${src.shortTitle ?? src.title}${src.authors ? ` · ${src.authors}` : ""}${src.year ? `, ${src.year}` : ""}${pages ? ` · ${pages}` : ""}`,
    );
  }

  parts.push(
    "Справочно (внутренняя KB). Не диагноз. Дозы и показания — по актуальным КР МЗ РФ / локальному протоколу.",
  );
  return parts.join("\n\n");
}

export function formatRetrieveResultForAssistant(result: MedicalKnowledgeRetrieveResult): string {
  if (result.conflicts.length && result.canonicalResults.length === 0) {
    return result.draftDisclaimer;
  }
  if (!result.canonicalResults.length) {
    return "В внутренней базе знаний пока нет гайда по этому запросу. Уточните формулировку или добавьте тему в KB.";
  }
  return result.canonicalResults.map(formatArticleForAssistant).join("\n\n---\n\n");
}

/** Предпочесть curated-гайд среди результатов retrieve. */
export function pickPreferredEmergencyArticle(
  articles: CanonicalKnowledgeArticle[],
): CanonicalKnowledgeArticle | null {
  if (!articles.length) return null;
  const guide = articles.find(
    (a) => a.topicType === "emergency_guide" || a.version.includes("guide") || a.version.includes("skeleton"),
  );
  return guide ?? articles[0] ?? null;
}
