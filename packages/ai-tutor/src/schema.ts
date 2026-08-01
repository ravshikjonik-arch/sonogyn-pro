import { z } from "zod";

export const TutorModeSchema = z.enum([
  "explain",
  "teach",
  "quiz",
  "exam",
  "clinical_reasoning",
]);

export const TutorLevelSchema = z.enum(["student", "resident", "doctor"]);

export const TutorQuestionContextSchema = z.object({
  id: z.string().min(1).max(80),
  stem: z.string().min(1).max(4000),
  options: z.array(z.string().min(1).max(800)).min(2).max(8),
  correctIndex: z.number().int().min(0).max(7),
  explanation: z.string().min(1).max(4000),
  sourceTitle: z.string().max(240).optional(),
  sourceYear: z.number().int().min(1990).max(2100).optional(),
  userSelectedIndex: z.number().int().min(0).max(7).nullable().optional(),
  mediaCaption: z.string().max(400).optional(),
  topic: z.string().max(120).optional(),
});

/** T2.4 request — Explain is fully supported; other modes reserved for T2.5+. */
export const TutorRequestSchema = z.object({
  mode: TutorModeSchema.default("explain"),
  level: TutorLevelSchema.default("student"),
  question: TutorQuestionContextSchema,
  /** When true, server may call LLM to expand the rule-first explanation. */
  deepen: z.boolean().optional().default(false),
  locale: z.enum(["ru", "en"]).optional().default("ru"),
});

export const TutorCitationSchema = z.object({
  title: z.string().min(1).max(240),
  year: z.number().int().optional(),
});

export const TutorResponseSchema = z.object({
  mode: z.literal("explain"),
  answer: z.string().min(1).max(8000),
  keyPoints: z.array(z.string().min(1).max(500)).max(8),
  citations: z.array(TutorCitationSchema).max(8),
  followUpQuestions: z.array(z.string().min(1).max(400)).max(5),
  whyWrong: z.string().max(2000).nullable(),
  disclaimer: z.string().min(1).max(500),
  meta: z.object({
    pipeline: z.enum(["rule-first", "llm-explain"]),
    assistive: z.literal(true),
    level: TutorLevelSchema,
    noPhi: z.literal(true),
  }),
});

export type TutorMode = z.infer<typeof TutorModeSchema>;
export type TutorLevel = z.infer<typeof TutorLevelSchema>;
export type TutorQuestionContext = z.infer<typeof TutorQuestionContextSchema>;
export type TutorRequest = z.infer<typeof TutorRequestSchema>;
export type TutorResponse = z.infer<typeof TutorResponseSchema>;
