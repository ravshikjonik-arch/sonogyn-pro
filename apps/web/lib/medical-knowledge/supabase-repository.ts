import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CLINICAL_RAG_KNOWLEDGE_STATUSES,
  CLINICAL_RAG_SOURCE_STATUSES,
  type CanonicalKnowledgeArticle,
  type KnowledgeRepository,
  type SourceCitationPublic,
  createFixtureKnowledgeRepository,
} from "@repo/medical-knowledge";

function shouldUseFixtureFallback(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (process.env.MEDICAL_KNOWLEDGE_USE_FIXTURES === "true") return true;
  if (process.env.NODE_ENV !== "production") {
    const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    return msg.includes("does not exist") || msg.includes("relation") || error.code === "42P01";
  }
  return false;
}

function mapSourceRow(row: Record<string, unknown>): SourceCitationPublic {
  return {
    id: String(row.id),
    title: String(row.title),
    shortTitle: row.short_title ? String(row.short_title) : null,
    authors: row.authors ? String(row.authors) : null,
    organization: row.organization ? String(row.organization) : null,
    publisher: row.publisher ? String(row.publisher) : null,
    edition: row.edition ? String(row.edition) : null,
    year: typeof row.year === "number" ? row.year : null,
    isbn: row.isbn ? String(row.isbn) : null,
    doi: row.doi ? String(row.doi) : null,
    externalUrl: row.external_url ? String(row.external_url) : null,
    sourceType: row.source_type as SourceCitationPublic["sourceType"],
    language: String(row.language ?? "ru"),
    reviewStatus: row.review_status as SourceCitationPublic["reviewStatus"],
    version: String(row.version ?? "1.0.0"),
    chapter: row.chapter ? String(row.chapter) : null,
    pageStart: typeof row.page_start === "number" ? row.page_start : null,
    pageEnd: typeof row.page_end === "number" ? row.page_end : null,
    verified: row.verified === true,
  };
}

export function hashRagQuery(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase(), "utf8").digest("hex");
}

/** Supabase-backed repository; falls back to fixtures if vault tables are unavailable. */
export function createSupabaseKnowledgeRepository(supabase: SupabaseClient): KnowledgeRepository {
  const fallback = createFixtureKnowledgeRepository();

  return {
    async findPublishedArticles({ query, specialty, limit }) {
      let articleQuery = supabase
        .from("knowledge_articles")
        .select("id,slug,title,specialty,topic_type,summary,version,status")
        .eq("status", "published")
        .limit(limit);

      if (specialty) articleQuery = articleQuery.eq("specialty", specialty);

      const { data: articles, error } = await articleQuery;
      if (error) {
        if (shouldUseFixtureFallback(error)) {
          return fallback.findPublishedArticles({ query, specialty, limit });
        }
        return [];
      }
      if (!articles?.length) {
        return [];
      }

      const filtered = articles.filter((a) => {
        const hay = `${a.title} ${a.summary} ${a.slug}`.toLowerCase();
        const q = query.toLowerCase();
        return hay.includes(q) || q.includes("эндометри") || q.includes("endometri");
      });

      const ids = (filtered.length > 0 ? filtered : articles).map((a) => a.id);

      const { data: sections } = await supabase
        .from("knowledge_sections")
        .select("id,article_id,section_type,title,content,sort_order,review_status")
        .in("article_id", ids)
        .eq("review_status", "published")
        .order("sort_order");

      const { data: sourceLinks } = await supabase
        .from("knowledge_sources")
        .select(
          "id,article_id,section_id,source_id,page_start,page_end,chapter,relevance,verified, sources:source_id ( id,title,short_title,authors,organization,publisher,edition,year,isbn,doi,external_url,source_type,language,review_status,version )",
        )
        .in("article_id", ids)
        .eq("verified", true);

      const canonical: CanonicalKnowledgeArticle[] = (filtered.length > 0 ? filtered : articles).map(
        (article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          specialty: article.specialty,
          topicType: article.topic_type,
          summary: article.summary,
          version: article.version,
          sections: (sections ?? [])
            .filter((s) => s.article_id === article.id)
            .filter((s) => CLINICAL_RAG_KNOWLEDGE_STATUSES.has(s.review_status))
            .map((s) => ({
              id: s.id,
              sectionType: s.section_type,
              title: s.title,
              content: s.content,
              sortOrder: s.sort_order,
            })),
          sources: (sourceLinks ?? [])
            .filter((link) => link.article_id === article.id)
            .map((link) => {
              const src = Array.isArray(link.sources) ? link.sources[0] : link.sources;
              if (!src) return null;
              if (!CLINICAL_RAG_SOURCE_STATUSES.has(String(src.review_status))) return null;
              return mapSourceRow({
                ...src,
                chapter: link.chapter,
                page_start: link.page_start,
                page_end: link.page_end,
                verified: link.verified,
              });
            })
            .filter(Boolean) as SourceCitationPublic[],
        }),
      );

      return canonical.slice(0, limit);
    },

    async findPublishedSourceCitations(sourceIds) {
      if (sourceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("source_catalog_public")
        .select("*")
        .in("id", sourceIds);
      if (error) {
        if (shouldUseFixtureFallback(error)) {
          return fallback.findPublishedSourceCitations(sourceIds);
        }
        return [];
      }
      if (!data?.length) {
        return [];
      }
      return data.map((row) =>
        mapSourceRow({
          id: row.id,
          title: row.title,
          short_title: row.short_title,
          authors: row.authors,
          organization: row.organization,
          publisher: row.publisher,
          edition: row.edition,
          year: row.year,
          isbn: row.isbn,
          doi: row.doi,
          external_url: row.external_url,
          source_type: row.source_type,
          language: row.language,
          review_status: row.review_status,
          version: row.version,
        }),
      );
    },
  };
}
