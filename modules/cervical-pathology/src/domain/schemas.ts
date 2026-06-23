/**
 * Domain value objects & schemas — Cervical Pathology Intelligence.
 * @see IFCPC 2011, Bethesda, ASCCP 2019
 */

import { z } from "zod";

export const CpiDisclaimer =
  "This clinical decision support tool assists physicians and does not replace clinical judgment, histopathology, or national guideline recommendations.";

// ── IFCPC (Part 1) ──
export const IfcpcTzSchema = z.enum(["tz1", "tz2", "tz3"]);
export const IfcpcScjSchema = z.enum([
  "scj_completely_visible",
  "scj_partially_visible",
  "scj_not_visible",
]);
export const IfcpcAdequacySchema = z.enum(["adequacy_satisfactory", "adequacy_unsatisfactory"]);

export const IfcpcFindingIdSchema = z.string().min(1).max(64);

export const IfcpcColposcopySchema = z.object({
  adequacyId: IfcpcAdequacySchema,
  scjVisibilityId: IfcpcScjSchema,
  transformationZoneTypeId: IfcpcTzSchema,
  findingSignIds: z.array(IfcpcFindingIdSchema).max(32),
  freeTextNotes: z.string().max(8000).optional(),
});

export type IfcpcColposcopy = z.infer<typeof IfcpcColposcopySchema>;

// ── HPV (Part 2) ──
export const HpvGenotypeSchema = z.enum([
  "negative",
  "hpv16",
  "hpv18",
  "hpv31",
  "hpv33",
  "hpv45",
  "hpv52",
  "hpv58",
  "other_hr",
]);

export const HpvTestSchema = z.object({
  status: z.enum(["negative", "positive", "not_tested"]),
  genotypes: z.array(HpvGenotypeSchema).max(12),
  viralLoad: z.enum(["not_available", "low", "high"]).default("not_available"),
  persistent: z.boolean().default(false),
  previousPositiveAt: z.string().datetime({ offset: true }).optional(),
});

export type HpvTest = z.infer<typeof HpvTestSchema>;

// ── Bethesda (Part 3) ──
export const BethesdaResultSchema = z.enum([
  "nilm",
  "ascus",
  "asc_h",
  "lsil",
  "hsil",
  "agc",
  "ais",
  "scc",
  "unsatisfactory",
]);

export const CytologySchema = z.object({
  result: BethesdaResultSchema,
  specimenAdequacy: z.enum(["satisfactory", "unsatisfactory"]).optional(),
  endocervicalComponent: z.boolean().nullable().optional(),
});

export type Cytology = z.infer<typeof CytologySchema>;

// ── Histology (Part 4) ──
export const HistologyResultSchema = z.enum([
  "none",
  "negative",
  "cin1",
  "cin2",
  "cin3",
  "ais",
  "microinvasive",
  "invasive",
  "pending",
]);

export const HistologySchema = z.object({
  result: HistologyResultSchema,
  priorResult: HistologyResultSchema.optional(),
  marginsPositive: z.boolean().optional(),
});

export type Histology = z.infer<typeof HistologySchema>;

// ── Swede (Part 5) ──
export const SwedeScoreInputSchema = z.object({
  acetowhite: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  margins: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  vessels: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  lesionSize: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  iodine: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

export type SwedeScoreInputDto = z.infer<typeof SwedeScoreInputSchema>;

// ── Clinical context ──
export const CpiClinicalContextSchema = z.object({
  age: z.number().int().min(15).max(90),
  pregnancy: z.boolean(),
  immunosuppression: z.boolean(),
  smoking: z.boolean(),
  priorCinTreatment: z.enum([
    "none",
    "excision_success",
    "excision_incomplete",
    "ablation",
    "repeat_treatment",
  ]),
  glandularSuspicion: z
    .enum(["none", "agc_nos", "agc_favor_neoplasia", "ais_suspected", "confirmed_ais"])
    .default("none"),
  suspectedGlandularLesion: z.boolean().default(false),
});

export type CpiClinicalContext = z.infer<typeof CpiClinicalContextSchema>;

// ── Quality (Part 9) ──
export const ColposcopyQualitySchema = z.object({
  scjDocumented: z.boolean(),
  tzDocumented: z.boolean(),
  aceticAcidAssessment: z.boolean(),
  iodineTestPerformed: z.boolean(),
  lesionDocumented: z.boolean(),
  photoPreAcetic: z.boolean(),
  photoPostAcetic: z.boolean(),
  photoPostSchiller: z.boolean(),
  adequacyDocumented: z.boolean(),
});

export type ColposcopyQuality = z.infer<typeof ColposcopyQualitySchema>;

// ── Aggregate input ──
export const CpiCaseInputSchema = z.object({
  patientId: z.string().uuid().optional(),
  caseId: z.string().uuid().optional(),
  colposcopy: IfcpcColposcopySchema,
  hpv: HpvTestSchema,
  cytology: CytologySchema,
  histology: HistologySchema,
  swede: SwedeScoreInputSchema.optional(),
  clinical: CpiClinicalContextSchema,
  quality: ColposcopyQualitySchema.optional(),
});

export type CpiCaseInput = z.infer<typeof CpiCaseInputSchema>;

// ── CDS actions (Part 7) ──
export const CpiClinicalActionSchema = z.enum([
  "observation",
  "repeat_hpv",
  "repeat_cytology",
  "repeat_colposcopy",
  "targeted_biopsy",
  "multiple_biopsies",
  "ecc",
  "lletz",
  "cold_knife_conization",
  "referral_oncologist",
]);

export type CpiClinicalAction = z.infer<typeof CpiClinicalActionSchema>;

export const CpiRiskOutputSchema = z.object({
  cin1Risk: z.number().min(0).max(1),
  cin2PlusRisk: z.number().min(0).max(1),
  cin3PlusRisk: z.number().min(0).max(1),
  aisRisk: z.number().min(0).max(1),
  invasionRisk: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
});

export type CpiRiskOutput = z.infer<typeof CpiRiskOutputSchema>;

export const CpiEvaluationResultSchema = z.object({
  schema: z.literal("cpi.evaluation.v1"),
  version: z.literal("1.0.0"),
  computedAt: z.string().datetime(),
  ifcpcProtocolText: z.string(),
  ifcpcConclusion: z.string(),
  swedeTotal: z.number().int().min(0).max(10).nullable(),
  swedeMappedFindingIds: z.array(z.string()),
  risk: CpiRiskOutputSchema,
  qualityScore: z.number().int().min(0).max(100).nullable(),
  qualityInterpretation: z.string().nullable(),
  actions: z.array(
    z.object({
      action: CpiClinicalActionSchema,
      labelRu: z.string(),
      priority: z.enum(["primary", "secondary", "conditional"]),
      rationale: z.string(),
      evidence: z.array(z.string()),
      references: z.array(
        z.object({
          id: z.string(),
          organization: z.string(),
          title: z.string(),
          year: z.number(),
          citation: z.string(),
        }),
      ),
    }),
  ),
  explanation: z.string(),
  disclaimer: z.string(),
});

export type CpiEvaluationResult = z.infer<typeof CpiEvaluationResultSchema>;
