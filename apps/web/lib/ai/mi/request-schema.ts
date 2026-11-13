import { EVIDENCE_CORPUS_MODES } from "@repo/evidence-retrieval";
import { MI_LIMITS } from "@repo/medical-intelligence";
import { z } from "zod";

/**
 * API boundary schema (Zod, mandatory). Shape only — clinical/contract validation of
 * observations is done by `@repo/morphology-core` inside the orchestrator.
 */
const ValueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("enum"), code: z.string().min(1).max(64) }),
  z.object({ kind: z.literal("enum_set"), codes: z.array(z.string().min(1).max(64)).max(16) }),
  z.object({ kind: z.literal("boolean"), present: z.boolean() }),
  z.object({ kind: z.literal("text"), text: z.string().max(500) }),
  z.object({ kind: z.literal("quantity"), value: z.number().finite(), unit: z.string().max(8) }),
  z.object({ kind: z.literal("not_assessed") }),
]);

const ObservationSchema = z
  .object({
    id: z.string().min(1).max(200),
    subjectId: z.string().max(200).nullable().optional(),
    anatomy: z.string().min(1).max(64),
    feature: z.string().min(1).max(120),
    value: ValueSchema.nullable(),
    status: z.string().min(1).max(32),
    source: z.string().min(1).max(32),
    confidence: z.object({ score: z.number(), method: z.string().max(32) }).nullable().optional(),
    laterality: z.string().max(32).nullable().optional(),
    plane: z.string().max(32).nullable().optional(),
    measurement: z.number().finite().nullable().optional(),
    unit: z.string().max(8).nullable().optional(),
    timestamp: z.string().min(10).max(40),
    classificationContext: z.array(z.string().max(64)).max(16).nullable().optional(),
    definitionVersion: z.string().max(32).nullable().optional(),
    alternatives: z.array(ValueSchema).max(10).nullable().optional(),
    confirmation: z.object({ by: z.literal("physician"), at: z.string().max(40) }).nullable().optional(),
    rawText: z.string().max(1000).nullable().optional(),
  })
  .strict();

const DecisionSchema = z.discriminatedUnion("action", [
  z.object({ observationId: z.string().min(1).max(200), action: z.literal("confirm") }),
  z.object({
    observationId: z.string().min(1).max(200),
    action: z.literal("correct"),
    value: ValueSchema.nullable().optional(),
    measurement: z.number().finite().nullable().optional(),
    unit: z.string().max(8).nullable().optional(),
  }),
  z.object({ observationId: z.string().min(1).max(200), action: z.literal("reject"), reason: z.string().max(300).optional() }),
  z.object({ observationId: z.string().min(1).max(200), action: z.literal("accept_status") }),
  z.object({ observationId: z.string().min(1).max(200), action: z.literal("choose_alternative"), alternativeIndex: z.number().int().min(0).max(9) }),
]);

const Base = {
  requestId: z.string().min(1).max(100).optional(),
  idempotencyKey: z.string().min(8).max(100).optional(),
};

export const MiRequestSchema = z.discriminatedUnion("inputType", [
  z.object({ ...Base, inputType: z.literal("free_text"), text: z.string().min(1).max(MI_LIMITS.maxTextChars) }).strict(),
  z
    .object({
      ...Base,
      inputType: z.literal("structured_morphology"),
      observations: z.array(ObservationSchema).max(MI_LIMITS.maxObservations),
      reviewDecisions: z.array(DecisionSchema).max(MI_LIMITS.maxDecisions).optional(),
      reviewedAt: z.string().max(40).optional(),
    })
    .strict(),
  z
    .object({
      ...Base,
      inputType: z.literal("classification_request"),
      engineId: z.string().min(1).max(64),
      observations: z.array(ObservationSchema).max(MI_LIMITS.maxObservations),
      reviewDecisions: z.array(DecisionSchema).max(MI_LIMITS.maxDecisions).optional(),
      reviewedAt: z.string().max(40).optional(),
      clinicalContext: z
        .object({
          menopause: z.enum(["pre", "post"]).optional(),
          ageYears: z.number().int().min(10).max(110).optional(),
          cycleDay: z.number().int().min(1).max(60).optional(),
          iotaCenterType: z.enum(["oncology", "other"]).optional(),
        })
        .strict()
        .optional(),
      subjectId: z.string().max(200).optional(),
      includeEvidence: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      ...Base,
      inputType: z.literal("clinical_question"),
      question: z.string().min(MI_LIMITS.minQuestionChars).max(MI_LIMITS.maxQuestionChars),
      corpusMode: z.enum(EVIDENCE_CORPUS_MODES as [string, ...string[]]).optional(),
    })
    .strict(),
]);

export type MiRequestBody = z.infer<typeof MiRequestSchema>;
