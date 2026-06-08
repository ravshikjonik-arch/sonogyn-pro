import { z } from "zod";

/** Uterus position — clinical documentation (IDEA workflow). */
export const uterusPositionSchema = z.enum(["anteverted", "retroverted", "mid"]);
export const uterusSizeSchema = z.enum(["normal", "enlarged"]);
export const myometriumTextureSchema = z.enum(["homogeneous", "heterogeneous"]);
export const ovaryVisibilitySchema = z.enum(["visible", "not_visualized", "partial"]);
export const ovarySizeSchema = z.enum(["normal", "enlarged"]);
export const cystCharacteristicSchema = z.enum(["unilocular", "multilocular", "ground_glass"]);

export const adnexaSideSchema = z.object({
  ovaryVisibility: ovaryVisibilitySchema,
  ovarySize: ovarySizeSchema,
  endometriomaPresent: z.boolean(),
  cystCharacteristics: z.array(cystCharacteristicSchema).default([]),
});

export const ideaStep1Schema = z.object({
  uterus: z.object({
    position: uterusPositionSchema,
    size: uterusSizeSchema,
    myometrium: myometriumTextureSchema,
    adenomyosisSuspicion: z.boolean(),
  }),
  adnexaRight: adnexaSideSchema,
  adnexaLeft: adnexaSideSchema,
  freeTextComment: z.string().max(500).default(""),
});

export const ovarianMobilitySchema = z.enum(["mobile", "reduced_mobility", "fixed"]);
export const tendernessSeveritySchema = z.enum(["mild", "moderate", "severe"]);

export const siteTendernessSchema = z.object({
  present: z.boolean(),
  severity: tendernessSeveritySchema.optional(),
});

export const ideaStep2Schema = z.object({
  softMarkers: z.object({
    tendernessOnProbePalpation: z.boolean(),
    fixedOvaries: z.boolean(),
    peritonealFluid: z.boolean(),
  }),
  ovarianMobilityRight: ovarianMobilitySchema,
  ovarianMobilityLeft: ovarianMobilitySchema,
  siteTenderness: z.object({
    pouchOfDouglas: siteTendernessSchema,
    uterosacralRight: siteTendernessSchema,
    uterosacralLeft: siteTendernessSchema,
    bladderBase: siteTendernessSchema,
  }),
});

export const slidingSignStateSchema = z.enum(["present", "absent", "reduced"]);

export const ideaStep3Schema = z.object({
  slidingSign: z.object({
    anteriorCompartment: slidingSignStateSchema,
    posteriorCompartment: slidingSignStateSchema,
    rightOvarianFossa: slidingSignStateSchema,
    leftOvarianFossa: slidingSignStateSchema,
  }),
  /** Region ids from anatomical diagram (also mirrored as text for SR). */
  diagramSelectedRegionIds: z.array(z.string()).default([]),
});

export const noduleLocationSchema = z.enum([
  "rectovaginal_septum",
  "uterosacral_ligament_right",
  "uterosacral_ligament_left",
  "torus_uterinus",
  "bladder",
  "ureter_right",
  "ureter_left",
  "bowel_rectum",
  "bowel_sigmoid",
  "vagina",
]);

export const depthOfInfiltrationSchema = z.enum(["superficial", "muscular", "submucosal"]);
export const noduleShapeSchema = z.enum(["nodular", "plaque", "stellate"]);
export const vascularizationSchema = z.enum(["minimal", "moderate", "abundant"]);

export const ideaNoduleSchema = z.object({
  id: z.string().min(1),
  location: noduleLocationSchema,
  sizeLengthMm: z.number().positive().max(200),
  sizeWidthMm: z.number().positive().max(200),
  sizeHeightMm: z.number().positive().max(200),
  depthOfInfiltration: depthOfInfiltrationSchema,
  shape: noduleShapeSchema,
  associatedTenderness: z.boolean(),
  vascularizationDoppler: vascularizationSchema,
  /** Optional Penelope / vascular score placeholder (0–5) when applicable. */
  penelopeScore: z.number().int().min(0).max(5).optional(),
});

export const ideaStep4Schema = z.object({
  nodules: z.array(ideaNoduleSchema).min(0).max(6),
});

export const aiPredictionSchema = z
  .object({
    model: z.string(),
    score: z.number(),
    notes: z.string().optional(),
  })
  .nullable()
  .default(null);

export const ideaFormSchema = z.object({
  patientId: z.string().max(120).default(""),
  examDate: z.string().min(1),
  sonographerId: z.string().max(120).default(""),
  step1: ideaStep1Schema,
  step2: ideaStep2Schema,
  step3: ideaStep3Schema,
  step4: ideaStep4Schema,
  impressionManualOverride: z.string().max(4000).default(""),
  aiPrediction: aiPredictionSchema,
});

export type IdeaFormValues = z.infer<typeof ideaFormSchema>;
export type IdeaStep1 = z.infer<typeof ideaStep1Schema>;
export type IdeaStep2 = z.infer<typeof ideaStep2Schema>;
export type IdeaStep3 = z.infer<typeof ideaStep3Schema>;
export type IdeaStep4 = z.infer<typeof ideaStep4Schema>;
export type IdeaNodule = z.infer<typeof ideaNoduleSchema>;

/** API / persistence payload (no RHF internal state). */
export const ideaExaminationPayloadSchema = ideaFormSchema.extend({
  metadata: z.object({
    version: z.literal("1.0"),
    schema: z.literal("idea-deep-endometriosis"),
  }),
});

export type IdeaExaminationPayload = z.infer<typeof ideaExaminationPayloadSchema>;

export type IdeaStepIndex = 0 | 1 | 2 | 3;

export const IDEA_STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
export type IdeaStepKey = (typeof IDEA_STEP_KEYS)[number];

export function getStepSchema(step: IdeaStepIndex) {
  switch (step) {
    case 0:
      return ideaStep1Schema;
    case 1:
      return ideaStep2Schema;
    case 2:
      return ideaStep3Schema;
    case 3:
      return ideaStep4Schema;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

export function pickStepValues(values: IdeaFormValues, step: IdeaStepIndex): unknown {
  switch (step) {
    case 0:
      return values.step1;
    case 1:
      return values.step2;
    case 2:
      return values.step3;
    case 3:
      return values.step4;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}
