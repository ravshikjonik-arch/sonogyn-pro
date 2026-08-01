import { z } from "zod";

export const QuizLevelSchema = z.enum(["doctor", "student"]);

export const QuizSourceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  year: z.number().int().min(1990).max(2100),
  status: z.string().max(80).optional(),
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
