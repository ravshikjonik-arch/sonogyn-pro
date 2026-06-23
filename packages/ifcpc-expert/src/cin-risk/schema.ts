import { z } from "zod";

import { IfcpcFindingSignIdSchema, IfcpcTransformationZoneIdSchema } from "../schema/api-schema";

export const BethesdaCytologySchema = z.enum([
  "nilm",
  "ascus",
  "lsil",
  "asc_h",
  "hsil",
  "agc",
  "unsatisfactory",
]);

export const HpvStatusSchema = z.enum(["negative", "positive", "not_tested"]);

export const PriorBiopsyResultSchema = z.enum([
  "none",
  "negative",
  "cin1",
  "cin2",
  "cin3",
  "ais",
  "invasion",
]);

export const PriorCinTreatmentHistorySchema = z.enum([
  "none",
  "excision_success",
  "excision_incomplete",
  "ablation",
  "repeat_treatment",
]);

export const CinRiskCalculatorInputSchema = z.object({
  age: z.number().int().min(15).max(90),
  hpvStatus: HpvStatusSchema,
  hpv16Positive: z.boolean(),
  hpv18Positive: z.boolean(),
  otherHrHpvPositive: z.boolean(),
  cytology: BethesdaCytologySchema,
  transformationZoneTypeId: IfcpcTransformationZoneIdSchema,
  ifcpcFindingSignIds: z.array(IfcpcFindingSignIdSchema).max(32),
  priorBiopsy: PriorBiopsyResultSchema,
  immunodeficiency: z.boolean(),
  pregnancy: z.boolean(),
  priorCinTreatment: PriorCinTreatmentHistorySchema,
});

export type CinRiskCalculatorInputDto = z.infer<typeof CinRiskCalculatorInputSchema>;

export const CinRiskProbabilitySchema = z.object({
  outcome: z.enum(["normal", "cin1", "cin2", "cin3", "ais", "invasion"]),
  labelRu: z.string(),
  probability: z.number().min(0).max(1),
  percentage: z.number().min(0).max(100),
});

export const CinRiskRecommendationSchema = z.object({
  summary: z.string(),
  actions: z.array(z.string()),
  followUp: z.string(),
  urgency: z.enum(["routine", "soon", "urgent", "emergency"]),
  references: z.array(z.string()),
});

export const CinRiskCalculatorResultSchema = z.object({
  probabilities: z.array(CinRiskProbabilitySchema),
  cin1: z.number().min(0).max(1),
  cin2: z.number().min(0).max(1),
  cin3: z.number().min(0).max(1),
  ais: z.number().min(0).max(1),
  invasion: z.number().min(0).max(1),
  cin2plus: z.number().min(0).max(1),
  cin3plus: z.number().min(0).max(1),
  cin2plusPercentage: z.number().min(0).max(100),
  cin3plusPercentage: z.number().min(0).max(100),
  invasionPercentage: z.number().min(0).max(100),
  cin2plusTier: z.object({
    tier: z.enum(["very_low", "low", "moderate", "high", "very_high"]),
    labelRu: z.string(),
    color: z.string(),
  }),
  invasionTier: z.object({
    tier: z.enum(["negligible", "low", "moderate", "high"]),
    labelRu: z.string(),
    color: z.string(),
  }),
  algorithmSteps: z.array(z.string()),
  logitBreakdown: z.record(z.enum(["normal", "cin1", "cin2", "cin3", "ais", "invasion"]), z.number()),
  recommendation: CinRiskRecommendationSchema,
  disclaimer: z.string(),
  modelVersion: z.string(),
});

/** POST /api/ifcpc-expert/cin-risk/calculate */
export const CalculateCinRiskBodySchema = CinRiskCalculatorInputSchema;

export const CalculateCinRiskResponseSchema = z.object({
  ok: z.literal(true),
  result: CinRiskCalculatorResultSchema,
});

export type CalculateCinRiskBody = z.infer<typeof CalculateCinRiskBodySchema>;
export type CalculateCinRiskResponse = z.infer<typeof CalculateCinRiskResponseSchema>;

/** JSON Schema export for OpenAPI / Supabase documentation. */
export const CIN_RISK_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CinRiskCalculatorInput",
  type: "object",
  required: [
    "age",
    "hpvStatus",
    "hpv16Positive",
    "hpv18Positive",
    "otherHrHpvPositive",
    "cytology",
    "transformationZoneTypeId",
    "ifcpcFindingSignIds",
    "priorBiopsy",
    "immunodeficiency",
    "pregnancy",
    "priorCinTreatment",
  ],
  properties: {
    age: { type: "integer", minimum: 15, maximum: 90 },
    hpvStatus: { type: "string", enum: ["negative", "positive", "not_tested"] },
    hpv16Positive: { type: "boolean" },
    hpv18Positive: { type: "boolean" },
    otherHrHpvPositive: { type: "boolean" },
    cytology: {
      type: "string",
      enum: ["nilm", "ascus", "lsil", "asc_h", "hsil", "agc", "unsatisfactory"],
    },
    transformationZoneTypeId: { type: "string", enum: ["tz1", "tz2", "tz3"] },
    ifcpcFindingSignIds: { type: "array", items: { type: "string" }, maxItems: 32 },
    priorBiopsy: {
      type: "string",
      enum: ["none", "negative", "cin1", "cin2", "cin3", "ais", "invasion"],
    },
    immunodeficiency: { type: "boolean" },
    pregnancy: { type: "boolean" },
    priorCinTreatment: {
      type: "string",
      enum: ["none", "excision_success", "excision_incomplete", "ablation", "repeat_treatment"],
    },
  },
} as const;
