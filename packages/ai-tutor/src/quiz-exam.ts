import { z } from "zod";

import { TutorLevelSchema } from "./schema";

const TutorBankQuestionSchema = z.object({
  id: z.string().min(1).max(80),
  stem: z.string().min(1).max(4000),
  options: z.array(z.string().min(1).max(800)).min(2).max(8),
  correctIndex: z.number().int().min(0).max(7),
  explanation: z.string().min(1).max(4000),
  sourceTitle: z.string().max(240).optional(),
  sourceYear: z.number().int().optional(),
  level: z.enum(["student", "doctor"]).optional(),
  mediaCaption: z.string().max(400).optional(),
});

export const TutorQuizExamRequestSchema = z.object({
  mode: z.enum(["quiz", "exam"]),
  level: TutorLevelSchema.default("student"),
  topic: z.string().min(1).max(120).optional(),
  count: z.number().int().min(1).max(50).optional(),
  questions: z.array(TutorBankQuestionSchema).min(1).max(200),
  locale: z.enum(["ru", "en"]).optional().default("ru"),
});

export type TutorQuizExamRequest = z.infer<typeof TutorQuizExamRequestSchema>;

export const TutorGeneratedQuestionSchema = z.object({
  id: z.string(),
  stem: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number().int(),
  explanation: z.string(),
  sourceTitle: z.string().optional(),
  sourceYear: z.number().int().optional(),
  mediaCaption: z.string().optional(),
});

export const TutorQuizExamResponseSchema = z.object({
  mode: z.enum(["quiz", "exam"]),
  topic: z.string().nullable(),
  timeLimitMin: z.number().int().nullable(),
  passingScore: z.number().int(),
  questions: z.array(TutorGeneratedQuestionSchema).min(1),
  disclaimer: z.string(),
  meta: z.object({
    pipeline: z.literal("rule-first"),
    assistive: z.literal(true),
    level: TutorLevelSchema,
    noPhi: z.literal(true),
  }),
});

export type TutorQuizExamResponse = z.infer<typeof TutorQuizExamResponseSchema>;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function mapLevelFilter(
  level: "student" | "resident" | "doctor",
): "student" | "doctor" | "all" {
  if (level === "doctor") return "doctor";
  if (level === "student") return "student";
  return "all";
}

/** Rule-first Tutor Quiz/Exam — selects and shuffles bank questions (no LLM). */
export function buildTutorQuizExam(input: TutorQuizExamRequest): TutorQuizExamResponse {
  const levelFilter = mapLevelFilter(input.level);
  const pool = input.questions.filter((q) => {
    if (levelFilter === "all" || !q.level) return true;
    return q.level === levelFilter;
  });
  const source = pool.length ? pool : input.questions;
  const defaultCount = input.mode === "quiz" ? 8 : Math.min(20, source.length);
  const count = Math.min(input.count ?? defaultCount, source.length);
  const random = mulberry32(Date.now() % 2_147_483_647);
  const picked = shuffle(source, random).slice(0, count);

  return {
    mode: input.mode,
    topic: input.topic ?? null,
    timeLimitMin: input.mode === "exam" ? Math.max(10, Math.ceil(count * 1.5)) : null,
    passingScore: input.mode === "exam" ? 70 : 60,
    questions: picked.map((q) => ({
      id: q.id,
      stem: q.stem,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      sourceTitle: q.sourceTitle,
      sourceYear: q.sourceYear,
      mediaCaption: q.mediaCaption,
    })),
    disclaimer:
      "Учебный AI Tutor SonoGyn Pro. Не диагноз и не государственная сертификация — интерпретация за специалистом.",
    meta: {
      pipeline: "rule-first",
      assistive: true,
      level: input.level,
      noPhi: true,
    },
  };
}
