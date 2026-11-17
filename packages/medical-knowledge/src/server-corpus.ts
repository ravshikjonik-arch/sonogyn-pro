/**
 * Server-only: полный локальный корпус неотложки (node:fs).
 * Не импортировать из client components.
 */

import type { CanonicalKnowledgeArticle, SourceCitationPublic } from "./types";
import { EMERGENCY_ACTION_CARDS } from "./fixtures/emergency-action-cards";
import { ENDOMETRIOMA_DEMO_ARTICLE } from "./fixtures/endometrioma-demo";
import {
  getEmergencyCorpusStats,
  loadEmergencyCorpusArticles,
  resetEmergencyCorpusCache,
} from "./fixtures/load-emergency-corpus";
import type { KnowledgeRepository } from "./retrieval";
import { scoreArticle } from "./retrieval";

export { getEmergencyCorpusStats, loadEmergencyCorpusArticles, resetEmergencyCorpusCache };

/** Curated + полный корпус (если data/emergency-corpus на диске). */
export function createEmergencyKnowledgeRepository(): KnowledgeRepository {
  const corpus = loadEmergencyCorpusArticles();
  const curatedSlugs = new Set(EMERGENCY_ACTION_CARDS.map((c) => c.slug));
  const articles: CanonicalKnowledgeArticle[] = [
    ENDOMETRIOMA_DEMO_ARTICLE,
    ...EMERGENCY_ACTION_CARDS,
    ...corpus.filter((a) => !curatedSlugs.has(a.slug)),
  ];

  return {
    async findPublishedArticles({ query, specialty, limit }) {
      return articles
        .filter((a) => (specialty ? a.specialty === specialty : true))
        .filter((a) => scoreArticle(a, query) > 0)
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
