/**
 * Structured Reporting Engine (SRE) — shared Zod contracts.
 * Phase 1 · T1.1 — web, mobile, API, Supabase boundaries.
 */
import { z } from "zod";

import { clinicalPlainText, OptionalIsoDateStringSchema } from "./clinical-validation";

// --- Enums ----------------------------------------------------------------------

export const ReportEngineVersionSchema = z.literal("2026.1");
export type ReportEngineVersion = z.infer<typeof ReportEngineVersionSchema>;

export const ReportDomainSchema = z.enum(["adnex", "thyroid", "obstetric", "breast", "generic"]);
export type ReportDomain = z.infer<typeof ReportDomainSchema>;

export const ReportLocaleSchema = z.enum(["ru", "en"]);
export type ReportLocale = z.infer<typeof ReportLocaleSchema>;

export const ReportDocumentStatusSchema = z.enum(["draft", "edited", "finalized", "archived"]);
export type ReportDocumentStatus = z.infer<typeof ReportDocumentStatusSchema>;

export const ReportPatientIdentifierTypeSchema = z.enum(["pseudo", "mrn"]);
export type ReportPatientIdentifierType = z.infer<typeof ReportPatientIdentifierTypeSchema>;

export const ReportModalitySchema = z.literal("ultrasound");
export type ReportModality = z.infer<typeof ReportModalitySchema>;

// --- Citations ------------------------------------------------------------------

export const ReportCitationSchema = z.object({
  id: z.string().min(1).max(120),
  standard: z.string().min(1).max(240),
  version: z.string().max(64).optional(),
  section: z.string().max(240).optional(),
  label: z.string().min(1).max(500),
  url: z.string().url().optional(),
  quote: clinicalPlainText(1000).optional(),
});
export type ReportCitation = z.infer<typeof ReportCitationSchema>;

// --- Template catalog -----------------------------------------------------------

export const ReportTemplateFieldTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "enum",
  "measurement_mm",
  "orads_category",
  "iota_color_score",
]);
export type ReportTemplateFieldType = z.infer<typeof ReportTemplateFieldTypeSchema>;

export const ReportTemplateFieldSchema = z.object({
  id: z.string().min(1).max(80),
  type: ReportTemplateFieldTypeSchema,
  labelKey: z.string().min(1).max(120),
  required: z.boolean().default(false),
  enumValues: z.array(z.string()).optional(),
  group: z.enum(["context", "measurements", "morphology", "classification", "free_text"]).optional(),
});
export type ReportTemplateField = z.infer<typeof ReportTemplateFieldSchema>;

export const ReportTemplateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  domain: ReportDomainSchema,
  version: z.string().min(1).max(32),
  engineId: z.string().min(1).max(80),
  locales: z.array(ReportLocaleSchema).min(1),
  titleKey: z.string().min(1).max(120),
  descriptionKey: z.string().max(240).optional(),
  fields: z.array(ReportTemplateFieldSchema).default([]),
  isActive: z.boolean().default(true),
});
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

/** Row shape for `report_templates` (Supabase). */
export const ReportTemplateRowSchema = ReportTemplateSchema.extend({
  schemaJson: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).omit({ fields: true });
export type ReportTemplateRow = z.infer<typeof ReportTemplateRowSchema>;

// --- Generated blocks -----------------------------------------------------------

export const StructuredReportBlocksSchema = z.object({
  description: clinicalPlainText(12000),
  impression: clinicalPlainText(4000),
  recommendations: clinicalPlainText(4000),
});
export type StructuredReportBlocks = z.infer<typeof StructuredReportBlocksSchema>;

/** User overrides per block after generation. */
export const StructuredReportEditedBlocksSchema = StructuredReportBlocksSchema.partial();
export type StructuredReportEditedBlocks = z.infer<typeof StructuredReportEditedBlocksSchema>;

export const StructuredReportOutputSchema = StructuredReportBlocksSchema.extend({
  citations: z.array(ReportCitationSchema).default([]),
  disclaimerKey: z.string().default("report.assistive_footer"),
  generatedAt: z.string().datetime(),
  locale: ReportLocaleSchema,
  engineId: z.string().min(1).max(80),
  templateSlug: z.string().min(1).max(80),
});
export type StructuredReportOutput = z.infer<typeof StructuredReportOutputSchema>;

// --- Patient / study stubs ------------------------------------------------------

export const StructuredReportPatientStubSchema = z.object({
  identifierType: ReportPatientIdentifierTypeSchema,
  value: z.string().min(1).max(120),
  sex: z.enum(["female", "male", "other"]).optional(),
  gestationalAgeWeeks: z.number().min(0).max(45).optional(),
  menopausalStatus: z.enum(["pre", "post", "unknown"]).optional(),
});
export type StructuredReportPatientStub = z.infer<typeof StructuredReportPatientStubSchema>;

export const StructuredReportStudyStubSchema = z.object({
  modality: ReportModalitySchema,
  region: z.string().min(1).max(240),
  protocol: z.string().max(240).optional(),
  machineVendor: z.string().max(120).optional(),
  operatorRole: z.string().max(120).optional(),
  studyDate: OptionalIsoDateStringSchema.optional(),
});
export type StructuredReportStudyStub = z.infer<typeof StructuredReportStudyStubSchema>;

export const StructuredReportFindingSchema = z.object({
  label: z.string().min(1).max(240),
  scorecard: z.string().max(240).optional(),
  category: z.string().max(120).optional(),
  recommendation: clinicalPlainText(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type StructuredReportFinding = z.infer<typeof StructuredReportFindingSchema>;

// --- Domain input: adnex (Phase 1 v1) -------------------------------------------

export const AdnexMenopauseSchema = z.enum(["pre", "post"]);
export const AdnexLocalizationSchema = z.enum(["ovarian", "extraovarian"]);
export const AdnexLesionKindSchema = z.enum(["physiological", "nonphysiological", "normal_ovary"]);
export const AdnexStructureSchema = z.enum(["unilocular", "multilocular", "solid"]);
export const AdnexSolidTypeSchema = z.enum(["smooth", "irregular", "papillary"]);
export const AdnexBloodFlowSchema = z.enum(["none", "minimal", "moderate", "marked"]);
export const AdnexIotaColorScoreSchema = z.enum(["1", "2", "3", "4"]);
export const OradsCategorySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const AdnexMeasurementSchema = z.object({
  lengthMm: z.number().min(0).max(500).optional(),
  widthMm: z.number().min(0).max(500).optional(),
  heightMm: z.number().min(0).max(500).optional(),
  volumeMl: z.number().min(0).max(50000).optional(),
});

export const AdnexMorphologySchema = z.object({
  localization: AdnexLocalizationSchema.optional(),
  menopause: AdnexMenopauseSchema.optional(),
  lesionKind: AdnexLesionKindSchema.optional(),
  structure: AdnexStructureSchema.optional(),
  septaThickness: z.enum(["thin", "thick"]).optional(),
  solidComponent: z.boolean().optional(),
  solidType: AdnexSolidTypeSchema.optional(),
  largestSolidDiameterMm: z.number().min(0).max(500).optional(),
  papillaryProjectionCount: z.enum(["0", "1", "2", "3", "4plus"]).optional(),
  acousticShadows: z.boolean().optional(),
  ascites: z.boolean().optional(),
  peritonealNodules: z.boolean().optional(),
  bloodFlow: AdnexBloodFlowSchema.optional(),
  iotaColorScore: AdnexIotaColorScoreSchema.optional(),
  incompleteSeptum: z.boolean().optional(),
});

export const AdnexClassificationSchema = z.object({
  oradsCategory: OradsCategorySchema.optional(),
  iotaBenignCodes: z.array(z.string().max(8)).default([]),
  iotaMalignantCodes: z.array(z.string().max(8)).default([]),
  iotaVerdict: z.enum(["benign", "malignant", "inconclusive"]).optional(),
  triangulationAgreement: z.enum(["full", "partial", "conflict"]).optional(),
});

export const AdnexStructuredReportInputSchema = z.object({
  domain: z.literal("adnex"),
  patient: StructuredReportPatientStubSchema.optional(),
  study: StructuredReportStudyStubSchema.optional(),
  measurements: AdnexMeasurementSchema.default({}),
  morphology: AdnexMorphologySchema.default({}),
  classification: AdnexClassificationSchema.default({}),
  freeTextFindings: clinicalPlainText(4000).optional(),
  navigatorPath: z
    .array(
      z.object({
        nodeId: z.string().min(1).max(80),
        optionId: z.string().min(1).max(80),
      }),
    )
    .optional(),
});
export type AdnexStructuredReportInput = z.infer<typeof AdnexStructuredReportInputSchema>;

// --- Domain input: thyroid TI-RADS (Phase 1) ------------------------------------

export const ThyroidCompositionSchema = z.enum([
  "no_nodule",
  "cystic",
  "spongiform",
  "mixed",
  "solid",
]);
export const ThyroidEchogenicitySchema = z.enum([
  "anechoic",
  "hyperechoic_or_isoechoic",
  "hypoechoic",
  "very_hypoechoic",
]);
export const ThyroidShapeSchema = z.enum(["wider_than_tall", "taller_than_wide"]);
export const ThyroidMarginSchema = z.enum([
  "smooth",
  "ill_defined",
  "lobulated_or_irregular",
  "extrathyroidal_extension",
]);
export const ThyroidEchogenicFociSchema = z.enum([
  "none_or_comet_tail",
  "macrocalcifications",
  "peripheral_rim",
  "punctate",
]);

export const ThyroidMeasurementSchema = z.object({
  thyroidVolumeMl: z.number().min(0).max(500).optional(),
  noduleMaxDiameterMm: z.number().min(0).max(150).optional(),
});

export const ThyroidMorphologySchema = z.object({
  composition: ThyroidCompositionSchema.optional(),
  echogenicity: ThyroidEchogenicitySchema.optional(),
  shape: ThyroidShapeSchema.optional(),
  margin: ThyroidMarginSchema.optional(),
  echogenicFoci: ThyroidEchogenicFociSchema.optional(),
  noduleLocation: z.string().max(120).optional(),
  parenchymaEchogenicity: z.string().max(120).optional(),
  parenchymaVascularity: z.string().max(120).optional(),
});

export const ThyroidStructuredReportInputSchema = z.object({
  domain: z.literal("thyroid"),
  patient: StructuredReportPatientStubSchema.optional(),
  study: StructuredReportStudyStubSchema.optional(),
  measurements: ThyroidMeasurementSchema.default({}),
  morphology: ThyroidMorphologySchema.default({}),
  freeTextFindings: clinicalPlainText(4000).optional(),
});
export type ThyroidStructuredReportInput = z.infer<typeof ThyroidStructuredReportInputSchema>;

// --- Domain input: obstetric biometry (Phase 1) ---------------------------------

export const ObstetricBiometrySchema = z.object({
  gestationalAgeWeeks: z.number().min(4).max(44).optional(),
  gestationalAgeDays: z.number().min(0).max(6).optional(),
  crlMm: z.number().min(0).max(200).optional(),
  bpdMm: z.number().min(0).max(150).optional(),
  hcMm: z.number().min(0).max(500).optional(),
  acMm: z.number().min(0).max(500).optional(),
  flMm: z.number().min(0).max(150).optional(),
  efwGrams: z.number().min(0).max(8000).optional(),
  placentaLocation: z.string().max(120).optional(),
  amnioticFluid: z.string().max(120).optional(),
});

export const ObstetricStructuredReportInputSchema = z.object({
  domain: z.literal("obstetric"),
  patient: StructuredReportPatientStubSchema.optional(),
  study: StructuredReportStudyStubSchema.optional(),
  biometry: ObstetricBiometrySchema.default({}),
  freeTextFindings: clinicalPlainText(4000).optional(),
});
export type ObstetricStructuredReportInput = z.infer<typeof ObstetricStructuredReportInputSchema>;

/** Discriminated union — extend with breast/generic in later tasks. */
export const StructuredReportInputSchema = z.discriminatedUnion("domain", [
  AdnexStructuredReportInputSchema,
  ThyroidStructuredReportInputSchema,
  ObstetricStructuredReportInputSchema,
]);
export type StructuredReportInput = z.infer<typeof StructuredReportInputSchema>;

// --- Full document (archive / PDF / API response) -------------------------------

export const StructuredReportDocumentSchema = z.object({
  version: ReportEngineVersionSchema,
  id: z.string().uuid().optional(),
  status: ReportDocumentStatusSchema.default("draft"),
  templateSlug: z.string().min(1).max(80),
  locale: ReportLocaleSchema,
  patient: StructuredReportPatientStubSchema.optional(),
  study: StructuredReportStudyStubSchema.optional(),
  input: StructuredReportInputSchema,
  output: StructuredReportOutputSchema,
  editedBlocks: StructuredReportEditedBlocksSchema.default({}),
  findings: z.array(StructuredReportFindingSchema).default([]),
});
export type StructuredReportDocument = z.infer<typeof StructuredReportDocumentSchema>;

/** Row shape for `structured_reports` (Supabase). */
export const StructuredReportRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  patientId: z.string().uuid().nullable(),
  studyId: z.string().uuid().nullable(),
  templateId: z.string().uuid(),
  status: ReportDocumentStatusSchema,
  inputJson: z.record(z.unknown()),
  outputJson: z.record(z.unknown()),
  editedBlocksJson: StructuredReportEditedBlocksSchema.default({}),
  locale: ReportLocaleSchema,
  finalizedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type StructuredReportRow = z.infer<typeof StructuredReportRowSchema>;

// --- API requests ---------------------------------------------------------------

export const GenerateStructuredReportRequestSchema = z.object({
  templateSlug: z.string().min(1).max(80),
  locale: ReportLocaleSchema.default("ru"),
  input: StructuredReportInputSchema,
  /** Skip persistence; return generated blocks only. */
  preview: z.boolean().default(false),
});
export type GenerateStructuredReportRequest = z.infer<typeof GenerateStructuredReportRequestSchema>;

export const GenerateStructuredReportResponseSchema = z.object({
  document: StructuredReportDocumentSchema,
  persistedId: z.string().uuid().optional(),
});
export type GenerateStructuredReportResponse = z.infer<typeof GenerateStructuredReportResponseSchema>;

export const UpdateStructuredReportBodySchema = z
  .object({
    editedBlocks: StructuredReportEditedBlocksSchema.optional(),
    status: ReportDocumentStatusSchema.optional(),
    output: StructuredReportOutputSchema.partial().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field required" });
export type UpdateStructuredReportBody = z.infer<typeof UpdateStructuredReportBodySchema>;

export const ListReportTemplatesQuerySchema = z.object({
  domain: ReportDomainSchema.optional(),
  locale: ReportLocaleSchema.optional(),
  activeOnly: z.coerce.boolean().default(true),
});
export type ListReportTemplatesQuery = z.infer<typeof ListReportTemplatesQuerySchema>;

export const CreateStructuredReportBodySchema = GenerateStructuredReportRequestSchema.extend({
  patientId: z.string().uuid().optional().nullable(),
  studyId: z.string().uuid().optional().nullable(),
}).omit({ preview: true });
export type CreateStructuredReportBody = z.infer<typeof CreateStructuredReportBodySchema>;
