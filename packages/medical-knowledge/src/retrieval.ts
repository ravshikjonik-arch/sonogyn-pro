import type {
  CanonicalKnowledgeArticle,
  MedicalKnowledgeRetrieveInput,
  MedicalKnowledgeRetrieveResult,
  SourceCitationPublic,
} from "./types";
import { ENDOMETRIOMA_DEMO_ARTICLE } from "./fixtures/endometrioma-demo";
import { EMERGENCY_ACTION_CARDS } from "./fixtures/emergency-action-cards";
import { assessCopyrightRequest } from "./copyright-guard";

export type KnowledgeRepository = {
  findPublishedArticles(input: {
    query: string;
    specialty?: string;
    limit: number;
  }): Promise<CanonicalKnowledgeArticle[]>;
  findPublishedSourceCitations(sourceIds: string[]): Promise<SourceCitationPublic[]>;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").trim();
}

function tokens(query: string): string[] {
  return normalize(query)
    .split(/[\s,/.;:!?()]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function scoreArticle(article: CanonicalKnowledgeArticle, query: string): number {
  const q = normalize(query);
  const qTokens = tokens(query);
  let score = 0;

  if (article.title.toLowerCase().includes(q)) score += 10;
  if (normalize(article.slug).includes(q.replace(/\s+/g, "-"))) score += 6;
  if (normalize(article.summary).includes(q)) score += 5;

  for (const alias of article.aliases ?? []) {
    const a = normalize(alias);
    if (!a) continue;
    // точное / запрос содержит алиас — сильный сигнал
    // «инфаркт» не должен бустить «инфаркт мозга» сильнее «инфаркт миокарда»
    if (q === a) score += 16;
    else if (q.includes(a) && a.length >= 3) score += 12;
    else if (a.startsWith(q) && q.length >= 5) score += 5;
    for (const t of qTokens) {
      if (a === t) score += 6;
      else if (t.length >= 4 && (a.startsWith(t) || t.startsWith(a))) score += 3;
    }
  }

  for (const section of article.sections) {
    if (normalize(section.title).includes(q)) score += 3;
    if (normalize(section.content).includes(q)) score += 2;
  }

  const hay = normalize(
    [
      article.title,
      article.summary,
      article.slug,
      ...(article.aliases ?? []),
      ...article.sections.map((s) => `${s.title} ${s.content}`),
    ].join(" "),
  );
  for (const t of qTokens) {
    if (t.length >= 4 && hay.includes(t)) score += 3;
    // грубая стемминг-подсказка для русского (эндометриоидной → эндометриоидн)
    if (t.length >= 6) {
      const stem = t.slice(0, -2);
      if (hay.includes(stem)) score += 2;
    }
  }

  // soft boost for emergency specialty when query looks acute
  if (
    article.specialty === "emergency" &&
    /(инфаркт|инсульт|шок|кома|тэла|криз|астм|анафилак|от[её]к)/i.test(query)
  ) {
    score += 2;
  }

  // curated-гайд неотложки — буст только при «остром» запросе (не ломает гинекологический retrieve)
  const acute =
    /(инфаркт|инсульт|шок|кома|тэла|криз|астм|анафилак|от[её]к|остановк|кровотеч|температур|лихорад|апноэ|одышк|слр|аритм|стенокард|пневмоторакс|судорог|менингит|внематочн|эклампс|преэклампс|чмт|отравлени|колик|ожог|непроходим|коллапс|синкоп|обморок)/i.test(
      query,
    );
  if (acute && article.topicType === "emergency_guide") score += 8;
  if (acute && article.topicType === "emergency_action") score += 3;
  if (acute && article.version.includes("guide")) score += 4;
  // сырые страницы / OCR — только запасной слой, не перекрывают curated-гайд
  if (article.topicType === "emergency_page") score -= 1;
  if (article.topicType === "emergency_ocr_page") score -= 14;

  return score;
}

export async function retrieveMedicalKnowledge(
  input: MedicalKnowledgeRetrieveInput,
  repo: KnowledgeRepository,
  options?: {
    fetchExternalEvidence?: (query: string) => Promise<MedicalKnowledgeRetrieveResult["evidenceChunks"]>;
  },
): Promise<MedicalKnowledgeRetrieveResult> {
  const copyright = assessCopyrightRequest(input.query);
  if (!copyright.allowed) {
    return {
      canonicalResults: [],
      evidenceChunks: [],
      sourceMetadata: [],
      confidence: "low",
      conflicts: [copyright.reason],
      draftDisclaimer: copyright.message,
    };
  }

  const articles = await repo.findPublishedArticles({
    query: input.query,
    specialty: input.specialty,
    limit: Math.max(input.limit, 20),
  });

  const ranked = articles
    .map((article) => ({ article, score: scoreArticle(article, input.query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit)
    .map((row) => row.article);

  const finalArticles = ranked;

  const sourceIds = [...new Set(finalArticles.flatMap((a) => a.sources.map((s) => s.id)))];

  const sourceMetadata = await repo.findPublishedSourceCitations(sourceIds);

  const evidenceChunks = options?.fetchExternalEvidence
    ? await options.fetchExternalEvidence(input.query)
    : [];

  const confidence =
    finalArticles.length >= 2
      ? "high"
      : finalArticles.length === 1
        ? "medium"
        : evidenceChunks.length > 0
          ? "medium"
          : "low";

  return {
    canonicalResults: finalArticles,
    evidenceChunks,
    sourceMetadata,
    confidence,
    conflicts: [],
    draftDisclaimer:
      "Структурированный справочный ответ SonoGyn Pro на основе внутренней KB. Не заменяет очный приём и КР; интерпретация — врачу.",
  };
}

function articleMatchesQuery(article: CanonicalKnowledgeArticle, query: string): boolean {
  return scoreArticle(article, query) > 0;
}

/**
 * Клиент-безопасный seed (без node:fs).
 * Полный корпус: `createEmergencyKnowledgeRepository` из `./server-corpus` (только server).
 */
export function createFixtureKnowledgeRepository(): KnowledgeRepository {
  const articles: CanonicalKnowledgeArticle[] = [ENDOMETRIOMA_DEMO_ARTICLE, ...EMERGENCY_ACTION_CARDS];

  return {
    async findPublishedArticles({ query, specialty, limit }) {
      return articles
        .filter((a) => (specialty ? a.specialty === specialty : true))
        .filter((a) => articleMatchesQuery(a, query))
        .sort((a, b) => scoreArticle(b, query) - scoreArticle(a, query))
        .slice(0, limit);
    },
    async findPublishedSourceCitations(sourceIds) {
      const all = articles.flatMap((a) => a.sources);
      const byId = new Map(all.map((s) => [s.id, s]));
      return sourceIds.map((id) => byId.get(id)).filter(Boolean) as SourceCitationPublic[];
    },
  };
}

export { ENDOMETRIOMA_DEMO_ARTICLE, EMERGENCY_ACTION_CARDS };
