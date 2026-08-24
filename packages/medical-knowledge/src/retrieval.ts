import type {
  CanonicalKnowledgeArticle,
  MedicalKnowledgeRetrieveInput,
  MedicalKnowledgeRetrieveResult,
  SourceCitationPublic,
} from "./types";
import { ENDOMETRIOMA_DEMO_ARTICLE } from "./fixtures/endometrioma-demo";
import { assessCopyrightRequest } from "./copyright-guard";

export type KnowledgeRepository = {
  findPublishedArticles(input: {
    query: string;
    specialty?: string;
    limit: number;
  }): Promise<CanonicalKnowledgeArticle[]>;
  findPublishedSourceCitations(sourceIds: string[]): Promise<SourceCitationPublic[]>;
};

function scoreArticle(article: CanonicalKnowledgeArticle, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (article.title.toLowerCase().includes(q)) score += 8;
  if (article.slug.includes(q.replace(/\s+/g, "-"))) score += 6;
  if (article.summary.toLowerCase().includes(q)) score += 4;
  for (const section of article.sections) {
    if (section.title.toLowerCase().includes(q)) score += 3;
    if (section.content.toLowerCase().includes(q)) score += 2;
  }
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
    limit: input.limit,
  });

  const ranked = articles
    .map((article) => ({ article, score: scoreArticle(article, input.query) }))
    .filter((row) => row.score > 0 || input.query.length < 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit)
    .map((row) => row.article);

  const finalArticles =
    ranked.length > 0 ? ranked : articles.slice(0, input.limit);

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
      "Структурированный справочный ответ SonoGyn Pro на основе проверенных источников. Не заменяет очный приём; интерпретация — врачу.",
  };
}

/** In-memory repository for tests and local dev before migration is applied. */
export function createFixtureKnowledgeRepository(): KnowledgeRepository {
  const articles = [ENDOMETRIOMA_DEMO_ARTICLE];

  return {
    async findPublishedArticles({ query, specialty, limit }) {
      const q = query.toLowerCase();
      return articles
        .filter((a) => (specialty ? a.specialty === specialty : true))
        .filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.slug.includes(q.replace(/\s+/g, "-")) ||
            a.summary.toLowerCase().includes(q) ||
            a.sections.some((s) => s.content.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)) ||
            q.includes("эндометри") ||
            q.includes("endometri"),
        )
        .slice(0, limit);
    },
    async findPublishedSourceCitations(sourceIds) {
      const all = ENDOMETRIOMA_DEMO_ARTICLE.sources;
      return all.filter((s) => sourceIds.includes(s.id));
    },
  };
}

export { ENDOMETRIOMA_DEMO_ARTICLE };
