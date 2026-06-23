import { z } from "zod";

import { IFCPC_SIGNS, IFCPC_SECTIONS } from "../knowledge/nomenclature";

const signIdEnum = z.enum(
  IFCPC_SIGNS.map((s) => s.id) as [string, ...string[]],
);

const adequacyIds = IFCPC_SECTIONS.find((s) => s.id === "adequacy")!.signIds;
const scjIds = IFCPC_SECTIONS.find((s) => s.id === "scj_visibility")!.signIds;
const tzIds = IFCPC_SECTIONS.find((s) => s.id === "transformation_zone_type")!.signIds;

const findingSectionIds = new Set([
  "normal_findings",
  "abnormal_grade1",
  "abnormal_grade2",
  "suspicious_invasion",
]);

const findingSignIds = IFCPC_SIGNS.filter((s) => findingSectionIds.has(s.sectionId)).map(
  (s) => s.id,
);

export const IfcpcAdequacyIdSchema = z.enum(adequacyIds as [string, ...string[]]);
export type IfcpcAdequacyId = z.infer<typeof IfcpcAdequacyIdSchema>;

export const IfcpcScjVisibilityIdSchema = z.enum(scjIds as [string, ...string[]]);
export type IfcpcScjVisibilityId = z.infer<typeof IfcpcScjVisibilityIdSchema>;

export const IfcpcTransformationZoneIdSchema = z.enum(tzIds as [string, ...string[]]);
export type IfcpcTransformationZoneId = z.infer<typeof IfcpcTransformationZoneIdSchema>;

export const IfcpcFindingSignIdSchema = z.enum(findingSignIds as [string, ...string[]]);
export type IfcpcFindingSignId = z.infer<typeof IfcpcFindingSignIdSchema>;

export const IfcpcSignIdSchema = signIdEnum;
export type IfcpcSignId = z.infer<typeof IfcpcSignIdSchema>;

export const IfcpcQuadrantSchema = z.enum(["12", "3", "6", "9"]);
export type IfcpcQuadrant = z.infer<typeof IfcpcQuadrantSchema>;

export const IfcpcQuadrantNoteSchema = z.object({
  quadrant: IfcpcQuadrantSchema,
  signIds: z.array(IfcpcFindingSignIdSchema).max(32),
  note: z.string().max(2000).optional(),
});

export const IfcpcClinicalContextSchema = z.object({
  referralIndication: z.string().max(500).optional(),
  cytologyResult: z.string().max(200).optional(),
  hpvResult: z.string().max(200).optional(),
  priorTreatment: z.string().max(500).optional(),
  swedeScoreTotal: z.number().int().min(0).max(10).optional(),
});

export const IfcpcBiopsyUrgencySchema = z.enum([
  "not_indicated",
  "consider",
  "recommended",
  "mandatory",
  "urgent",
]);

export const IfcpcOverallImpressionSchema = z.enum([
  "normal",
  "benign_variants",
  "low_grade_changes",
  "high_grade_suspicion",
  "invasion_suspicion",
  "inadequate_exam",
]);

export const IfcpcExamAssessmentSchema = z.object({
  overallImpression: IfcpcOverallImpressionSchema,
  highestColposcopicGrade: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  biopsyUrgency: IfcpcBiopsyUrgencySchema,
  biopsyRationale: z.string().max(4000),
  cinRiskSummary: z.string().max(4000),
  hsilSummary: z.string().max(4000),
  invasionSummary: z.string().max(4000),
  recommendationText: z.string().max(4000),
  selectedSignCount: z.number().int().min(0).max(64),
  flags: z.array(z.string().max(64)).max(16),
});

/** Core exam payload — storage / sync. */
export const IfcpcColposcopyExamSchema = z.object({
  schema: z.literal("ifcpc.colposcopy.exam"),
  version: z.literal("1.0.0"),
  examId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  studyId: z.string().uuid().optional(),
  performedAt: z.string().datetime({ offset: true }),
  adequacyId: IfcpcAdequacyIdSchema,
  scjVisibilityId: IfcpcScjVisibilityIdSchema,
  transformationZoneTypeId: IfcpcTransformationZoneIdSchema,
  findingSignIds: z.array(IfcpcFindingSignIdSchema).max(32),
  quadrantNotes: z.array(IfcpcQuadrantNoteSchema).max(4).optional(),
  clinicalContext: IfcpcClinicalContextSchema.optional(),
  freeTextNotes: z.string().max(8000).optional(),
  physicianId: z.string().uuid().optional(),
  institution: z.string().max(300).optional(),
  assessment: IfcpcExamAssessmentSchema.optional(),
});

export type IfcpcColposcopyExamInput = z.infer<typeof IfcpcColposcopyExamSchema>;

/** POST /api/ifcpc-expert/exams — create structured exam. */
export const CreateIfcpcExamBodySchema = IfcpcColposcopyExamSchema.omit({
  assessment: true,
}).extend({
  computeAssessment: z.boolean().default(true),
});

export type CreateIfcpcExamBody = z.infer<typeof CreateIfcpcExamBodySchema>;

/** PATCH /api/ifcpc-expert/exams/:id */
export const UpdateIfcpcExamBodySchema = CreateIfcpcExamBodySchema.partial().extend({
  examId: z.string().uuid(),
});

export type UpdateIfcpcExamBody = z.infer<typeof UpdateIfcpcExamBodySchema>;

/** GET sign lookup — query by id or section. */
export const IfcpcSignLookupQuerySchema = z.object({
  signId: IfcpcSignIdSchema.optional(),
  sectionId: z
    .enum([
      "adequacy",
      "scj_visibility",
      "transformation_zone_type",
      "normal_findings",
      "abnormal_grade1",
      "abnormal_grade2",
      "suspicious_invasion",
    ])
    .optional(),
});

export type IfcpcSignLookupQuery = z.infer<typeof IfcpcSignLookupQuerySchema>;

/** Response wrapper for API routes. */
export const IfcpcExamResponseSchema = z.object({
  ok: z.literal(true),
  exam: IfcpcColposcopyExamSchema,
});

export const IfcpcNomenclatureResponseSchema = z.object({
  ok: z.literal(true),
  meta: z.object({
    sourceId: z.literal("ifcpc-rio-2011"),
    title: z.string(),
    version: z.string(),
    publishedYear: z.literal(2011),
    disclaimer: z.string(),
    references: z.array(z.string()),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      titleRu: z.string(),
      titleEn: z.string(),
      description: z.string(),
      multiSelect: z.boolean(),
      signIds: z.array(z.string()),
    }),
  ),
  signCount: z.number().int().positive(),
});

export type IfcpcNomenclatureResponse = z.infer<typeof IfcpcNomenclatureResponseSchema>;
