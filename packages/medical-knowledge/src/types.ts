import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "book",
  "guideline",
  "consensus",
  "article",
  "manual",
  "protocol",
  "lecture",
  "other",
]);

export const SourceReviewStatusSchema = z.enum([
  "raw",
  "processing",
  "extracted",
  "review_required",
  "reviewed",
  "published",
  "archived",
]);

export const KnowledgeSpecialtySchema = z.enum([
  "obstetrics",
  "gynecology",
  "breast",
  "ultrasound",
  "thyroid",
  "vascular",
  "general",
]);

export const KnowledgeSectionTypeSchema = z.enum([
  "definition",
  "ultrasound_findings",
  "doppler",
  "measurements",
  "differential",
  "classification",
  "clinical_context",
  "common_errors",
  "report_description",
  "report_conclusion",
  "education",
  "management_reference",
  "warning",
]);

export const SourceCitationPublicSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  shortTitle: z.string().nullable().optional(),
  authors: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  edition: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  isbn: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  externalUrl: z.union([z.string().url(), z.null()]).optional(),
  sourceType: SourceTypeSchema,
  language: z.string(),
  reviewStatus: SourceReviewStatusSchema,
  version: z.string(),
  chapter: z.string().nullable().optional(),
  pageStart: z.number().int().nullable().optional(),
  pageEnd: z.number().int().nullable().optional(),
  verified: z.boolean().optional(),
});

export type SourceCitationPublic = z.infer<typeof SourceCitationPublicSchema>;

export const CanonicalKnowledgeSectionSchema = z.object({
  id: z.string().uuid(),
  sectionType: KnowledgeSectionTypeSchema,
  title: z.string(),
  content: z.string(),
  sortOrder: z.number().int(),
});

export const CanonicalKnowledgeArticleSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  specialty: KnowledgeSpecialtySchema,
  topicType: z.string(),
  summary: z.string(),
  version: z.string(),
  sections: z.array(CanonicalKnowledgeSectionSchema),
  sources: z.array(SourceCitationPublicSchema),
});

export type CanonicalKnowledgeArticle = z.infer<typeof CanonicalKnowledgeArticleSchema>;

export const MedicalKnowledgeRetrieveInputSchema = z.object({
  query: z.string().trim().min(2).max(2000),
  specialty: KnowledgeSpecialtySchema.optional(),
  module: z.string().trim().max(80).optional(),
  classification: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(20).default(8),
});

export type MedicalKnowledgeRetrieveInput = z.infer<typeof MedicalKnowledgeRetrieveInputSchema>;

export const MedicalKnowledgeRetrieveResultSchema = z.object({
  canonicalResults: z.array(CanonicalKnowledgeArticleSchema),
  evidenceChunks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string(),
      provider: z.string(),
    }),
  ),
  sourceMetadata: z.array(SourceCitationPublicSchema),
  confidence: z.enum(["high", "medium", "low"]),
  conflicts: z.array(z.string()),
  draftDisclaimer: z.string(),
});

export type MedicalKnowledgeRetrieveResult = z.infer<typeof MedicalKnowledgeRetrieveResultSchema>;

/** Statuses allowed in clinical RAG — RAW/EXTRACTED never used. */
export const CLINICAL_RAG_SOURCE_STATUSES = new Set(["reviewed", "published"]);
export const CLINICAL_RAG_KNOWLEDGE_STATUSES = new Set(["reviewed", "published"]);
