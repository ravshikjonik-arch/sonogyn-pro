import { z } from "zod";

export const CytologyBethesdaCodeSchema = z.enum([
  "nilm",
  "asc-us",
  "asc-h",
  "lsil",
  "hsil",
  "agc",
  "ais",
  "carcinoma",
  "unsatisfactory",
]);

export const CytologyHpvStatusSchema = z.enum([
  "negative",
  "positive",
  "16-positive",
  "18-positive",
  "unknown",
]);

export const CytologyScreeningInputSchema = z.object({
  age: z.number().int().min(14).max(90),
  sexuallyActive: z.boolean().optional(),
  pregnant: z.boolean().optional(),
  immunodeficient: z.boolean().optional(),
  hivPositive: z.boolean().optional(),
  postmenopausal: z.boolean().optional(),
  lastPapMonthsAgo: z.number().int().min(0).max(600).nullable().optional(),
  lastHpvMonthsAgo: z.number().int().min(0).max(600).nullable().optional(),
  cytology: CytologyBethesdaCodeSchema.nullable().optional(),
  hpvStatus: CytologyHpvStatusSchema.optional(),
  priorExcision: z.boolean().optional(),
});

export const BethesdaAssistInputSchema = z.object({
  age: z.number().int().min(14).max(90),
  cytology: CytologyBethesdaCodeSchema,
  hpvStatus: CytologyHpvStatusSchema,
  hpv16Positive: z.boolean().optional(),
  hpv18Positive: z.boolean().optional(),
  pregnant: z.boolean().optional(),
  immunodeficient: z.boolean().optional(),
  hivPositive: z.boolean().optional(),
  priorExcision: z.boolean().optional(),
  priorCytology: CytologyBethesdaCodeSchema.nullable().optional(),
  colposcopyDone: z.boolean().optional(),
  histology: z.string().max(500).nullable().optional(),
});

export const CytologyQuizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(10),
});

export const SamplingChecklistSchema = z.object({
  stepsCompleted: z.array(z.number().int().min(1).max(10)),
});
