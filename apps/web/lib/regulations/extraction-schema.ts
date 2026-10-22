import { z } from "zod";

/** Draft aligned with @repo/clinical-guidelines ClinicalGuideline (review before merge). */
export const regulationGuidelineDraftSchema = z.object({
  title: z.string().min(3).max(500),
  summary: z.string().min(10).max(4000),
  shelf: z.enum(["kr_mz_rf", "orders_dzm", "orders_mz_rf", "protocols_org"]),
  documentKind: z.enum(["clinical_recommendation", "order", "protocol", "standard"]),
  issuer: z.enum(["mz_rf", "dzm", "roag", "other"]),
  specialty: z.enum(["obgyn", "obstetrics", "ultrasound", "mammology", "prenatal", "general"]),
  year: z.number().int().min(1990).max(2100).optional(),
  officialUrl: z.string().url().optional(),
  documentNumber: z.string().max(120).optional(),
  relevantSections: z.array(z.string().min(3)).max(40).default([]),
  recommendations: z
    .array(
      z.object({
        clinical_guideline: z.string().min(5),
        evidence_level: z.enum(["A", "B", "C", "unknown"]).default("unknown"),
        applicable_to: z.array(z.string().min(2)).max(20).default([]),
      }),
    )
    .max(30)
    .default([]),
  protocolChanges: z.array(z.string().min(5)).max(20).default([]),
  contraindications: z.array(z.string().min(5)).max(20).default([]),
  relatedNosologyIds: z.array(z.string().min(2)).max(15).default([]),
});

export type RegulationGuidelineDraft = z.infer<typeof regulationGuidelineDraftSchema>;

export const regulationExtractionEnvelopeSchema = z.object({
  draft: regulationGuidelineDraftSchema,
  confidence: z.enum(["low", "medium", "high"]),
  reviewNotesForEditor: z.string().max(2000).optional(),
});

export type RegulationExtractionEnvelope = z.infer<typeof regulationExtractionEnvelopeSchema>;
