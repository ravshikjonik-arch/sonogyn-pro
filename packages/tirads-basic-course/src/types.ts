import { z } from "zod";

export const curriculumSchema = z.object({
  meta: z.object({
    title: z.string(),
    based_on: z.string().optional(),
    audience: z.string().optional(),
    version: z.string().optional(),
    note: z.string().optional(),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      book_pages: z.string().optional(),
      modules: z.array(z.string()),
      status: z.enum(["complete", "outline_only", "partial"]).optional(),
    }),
  ),
});

export type TiradsCurriculum = z.infer<typeof curriculumSchema>;

export const quizSchema = z.object({
  meta: z.object({ title: z.string().optional(), total: z.number().optional() }),
  questions: z.array(
    z.object({
      id: z.number(),
      module: z.string(),
      q: z.string(),
      options: z.array(z.string()).min(2),
      answer: z.number().int().min(0),
      explain: z.string(),
    }),
  ),
});

export type TiradsQuiz = z.infer<typeof quizSchema>;
