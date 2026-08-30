import { z } from "zod";

import { clinicalPlainText, IsoDateStringSchema } from "./clinical-validation";

/** Template version for teaching-case structured editor. */
export const STRUCTURED_CASE_TEMPLATE_VERSION = "case-v1" as const;
export const STRUCTURED_PROTOCOL_TEMPLATE_VERSION = "protocol-v1" as const;

export const CalculatorSystemSchema = z.enum([
  "O-RADS",
  "BI-RADS",
  "TI-RADS",
  "FIGO",
  "IOTA",
  "FMF",
  "other",
]);
export type CalculatorSystem = z.infer<typeof CalculatorSystemSchema>;

/** Immutable calculator insert — user cannot edit category/summary via editor. */
export const StructuredCalculatorBlockSchema = z.object({
  id: z.string().uuid(),
  system: CalculatorSystemSchema,
  category: clinicalPlainText(200),
  summary: clinicalPlainText(4000),
  algorithmId: clinicalPlainText(120),
  algorithmVersion: clinicalPlainText(40),
  sourceLabel: clinicalPlainText(500),
  insertedAt: z.string().datetime(),
  immutable: z.literal(true).default(true),
  /** AI-generated narrative attached to calculator context. */
  isAiDraft: z.boolean().default(false),
});
export type StructuredCalculatorBlock = z.infer<typeof StructuredCalculatorBlockSchema>;

export const StructuredMediaRefSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid().optional(),
  label: clinicalPlainText(200).optional(),
  /** Safe data URL snapshot from DICOM viewer (no PHI tags). */
  snapshotDataUrl: z.string().max(2_000_000).optional(),
  insertedAt: z.string().datetime(),
});
export type StructuredMediaRef = z.infer<typeof StructuredMediaRefSchema>;

export const StructuredSectionContentSchema = z.object({
  html: z.string().max(12000).optional(),
  plain: clinicalPlainText(8000).optional(),
  blocks: z.array(StructuredCalculatorBlockSchema).max(20).default([]),
  mediaRefs: z.array(StructuredMediaRefSchema).max(12).default([]),
});
export type StructuredSectionContent = z.infer<typeof StructuredSectionContentSchema>;

export const StructuredCaseSectionIdSchema = z.enum([
  "study_area",
  "clinical_summary",
  "deidentified_images",
  "us_findings",
  "measurements",
  "calculator_result",
  "preliminary_conclusion",
  "differential",
  "colleague_question",
  "confirmation_method",
  "final_diagnosis",
  "educational_comment",
  "sources",
]);
export type StructuredCaseSectionId = z.infer<typeof StructuredCaseSectionIdSchema>;

export const STRUCTURED_CASE_SECTION_IDS = StructuredCaseSectionIdSchema.options;

export const StructuredCaseSectionsSchema = z.record(
  StructuredCaseSectionIdSchema,
  StructuredSectionContentSchema,
);
export type StructuredCaseSections = z.infer<typeof StructuredCaseSectionsSchema>;

export const StructuredCaseDocumentSchema = z.object({
  templateVersion: z.literal(STRUCTURED_CASE_TEMPLATE_VERSION),
  algorithmVersion: clinicalPlainText(40).optional(),
  sections: StructuredCaseSectionsSchema,
  searchText: clinicalPlainText(32000).default(""),
  editorState: z.record(z.unknown()).default({}),
  physicianConfirmedConclusion: z.boolean().default(false),
  lastSavedAt: z.string().datetime().optional(),
});
export type StructuredCaseDocument = z.infer<typeof StructuredCaseDocumentSchema>;

export const StructuredProtocolSectionIdSchema = z.enum([
  "description",
  "measurements",
  "structured_findings",
  "classification_category",
  "conclusion",
  "recommendations",
  "scale_source",
  "algorithm_meta",
]);
export type StructuredProtocolSectionId = z.infer<typeof StructuredProtocolSectionIdSchema>;

export const STRUCTURED_PROTOCOL_SECTION_IDS = StructuredProtocolSectionIdSchema.options;

export const StructuredProtocolSectionsSchema = z.record(
  StructuredProtocolSectionIdSchema,
  StructuredSectionContentSchema,
);
export type StructuredProtocolSections = z.infer<typeof StructuredProtocolSectionsSchema>;

export const StructuredProtocolDraftSchema = z.object({
  templateVersion: z.literal(STRUCTURED_PROTOCOL_TEMPLATE_VERSION),
  algorithmVersion: clinicalPlainText(40).optional(),
  algorithmDate: IsoDateStringSchema.optional(),
  scaleSource: clinicalPlainText(500).optional(),
  sections: StructuredProtocolSectionsSchema,
  searchText: clinicalPlainText(32000).default(""),
  editorState: z.record(z.unknown()).default({}),
  physicianConfirmedConclusion: z.boolean().default(false),
  lastSavedAt: z.string().datetime().optional(),
});
export type StructuredProtocolDraft = z.infer<typeof StructuredProtocolDraftSchema>;

export const UpsertStructuredCaseBodySchema = z.object({
  document: StructuredCaseDocumentSchema,
  changeSummary: clinicalPlainText(500).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  isAutosave: z.boolean().default(false),
});
export type UpsertStructuredCaseBody = z.infer<typeof UpsertStructuredCaseBodySchema>;

export const UpsertStructuredProtocolDraftBodySchema = z.object({
  draft: StructuredProtocolDraftSchema,
  changeSummary: clinicalPlainText(500).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  isAutosave: z.boolean().default(false),
});
export type UpsertStructuredProtocolDraftBody = z.infer<typeof UpsertStructuredProtocolDraftBodySchema>;

export const StructuredDocumentVersionSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  changeSummary: clinicalPlainText(500).nullable().optional(),
  templateVersion: z.string(),
  algorithmVersion: clinicalPlainText(40).nullable().optional(),
  createdAt: z.string().datetime(),
});
export type StructuredDocumentVersion = z.infer<typeof StructuredDocumentVersionSchema>;

export function emptyStructuredSection(): StructuredSectionContent {
  return { blocks: [], mediaRefs: [] };
}

export function emptyStructuredCaseDocument(): StructuredCaseDocument {
  const sections = {} as StructuredCaseSections;
  for (const id of STRUCTURED_CASE_SECTION_IDS) {
    sections[id] = emptyStructuredSection();
  }
  return {
    templateVersion: STRUCTURED_CASE_TEMPLATE_VERSION,
    sections,
    searchText: "",
    editorState: {},
    physicianConfirmedConclusion: false,
  };
}

export function emptyStructuredProtocolDraft(): StructuredProtocolDraft {
  const sections = {} as StructuredProtocolSections;
  for (const id of STRUCTURED_PROTOCOL_SECTION_IDS) {
    sections[id] = emptyStructuredSection();
  }
  return {
    templateVersion: STRUCTURED_PROTOCOL_TEMPLATE_VERSION,
    sections,
    searchText: "",
    editorState: {},
    physicianConfirmedConclusion: false,
  };
}

export const CALCULATOR_ALGORITHM_CATALOG: Record<
  CalculatorSystem,
  { algorithmId: string; algorithmVersion: string; sourceLabel: string }
> = {
  "O-RADS": {
    algorithmId: "orads-v2022",
    algorithmVersion: "2022",
    sourceLabel: "ACR O-RADS Ultrasound v2022",
  },
  "BI-RADS": {
    algorithmId: "birads-us-2023",
    algorithmVersion: "2023",
    sourceLabel: "ACR BI-RADS Ultrasound Atlas 2023",
  },
  "TI-RADS": {
    algorithmId: "tirads-2017",
    algorithmVersion: "2017",
    sourceLabel: "ACR TI-RADS 2017",
  },
  FIGO: {
    algorithmId: "figo-myoma-2021",
    algorithmVersion: "2021",
    sourceLabel: "FIGO Leiomyoma Classification 2021",
  },
  IOTA: {
    algorithmId: "iota-adnex-2020",
    algorithmVersion: "2020",
    sourceLabel: "IOTA Simple Rules / ADNEX",
  },
  FMF: {
    algorithmId: "fmf-screening-2023",
    algorithmVersion: "2023",
    sourceLabel: "FMF first-trimester screening",
  },
  other: {
    algorithmId: "custom",
    algorithmVersion: "1",
    sourceLabel: "Пользовательская шкала",
  },
};
