import { z } from "zod";

export const QuizLevelSchema = z.enum(["doctor", "student"]);

export const QuizSourceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  year: z.number().int().min(1990).max(2100),
  status: z.string().max(80).optional(),
});

export const QuizQuestionMediaSchema = z.object({
  type: z.literal("image"),
  src: z
    .string()
    .min(1)
    .max(500)
    .refine((value) => value.startsWith("/") || /^https:\/\//i.test(value), {
      message: "media.src must be a site path or https URL",
    }),
  alt: z.string().min(1).max(300),
  caption: z.string().max(400).optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1).max(80),
  category: z.string().min(1).max(80),
  level: QuizLevelSchema,
  question: z.string().min(1).max(4000),
  options: z.array(z.string().min(1).max(800)).min(2).max(8),
  correctIndex: z.number().int().min(0).max(7),
  explanation: z.string().min(1).max(4000),
  sourceId: z.string().min(1).max(80),
  media: QuizQuestionMediaSchema.optional(),
});

export const QuizBankSchema = z
  .object({
    topic: z.string().min(1).max(120),
    version: z.string().min(1).max(40),
    lastReviewed: z.string().min(1).max(40),
    sources: z.array(QuizSourceSchema).min(1).max(40),
    questions: z.array(QuizQuestionSchema).min(1).max(500),
  })
  .superRefine((bank, ctx) => {
    const sourceIds = new Set(bank.sources.map((s) => s.id));
    bank.questions.forEach((q, index) => {
      if (q.correctIndex >= q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", index, "correctIndex"],
          message: `correctIndex out of range for ${q.id}`,
        });
      }
      if (!sourceIds.has(q.sourceId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", index, "sourceId"],
          message: `unknown sourceId ${q.sourceId} for ${q.id}`,
        });
      }
    });
  });

export type QuizBankParsed = z.infer<typeof QuizBankSchema>;

export function parseQuizBank(raw: unknown): QuizBankParsed {
  return QuizBankSchema.parse(raw);
}

export function safeParseQuizBank(raw: unknown) {
  return QuizBankSchema.safeParse(raw);
}

export const QuizAnswerRecordSchema = z.enum(["correct", "incorrect"]);

export const QuizProgressSchema = z.record(z.string().min(1).max(80), QuizAnswerRecordSchema);

export const ExamAttemptModeSchema = z.enum([
  "self_assessment",
  "quick",
  "certification",
  "mock",
]);

/** Upsert payload for /api/education/exam-attempts (T2.2). */
export const ExamAttemptUpsertSchema = z.object({
  blueprintId: z.string().min(1).max(200),
  mode: ExamAttemptModeSchema.default("self_assessment"),
  level: QuizLevelSchema.optional(),
  answers: QuizProgressSchema,
  score: z.number().min(0).max(100).nullable().optional(),
  totalQuestions: z.number().int().min(0).max(500).optional(),
  correctCount: z.number().int().min(0).max(500).optional(),
  finished: z.boolean().optional(),
});

export type ExamAttemptUpsert = z.infer<typeof ExamAttemptUpsertSchema>;
export type ExamAttemptMode = z.infer<typeof ExamAttemptModeSchema>;
