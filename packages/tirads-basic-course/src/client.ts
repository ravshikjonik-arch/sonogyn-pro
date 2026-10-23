import curriculumJson from "../data/curriculum.json";
import quizJson from "../data/quiz/quiz.json";
import { curriculumSchema, quizSchema, type TiradsCurriculum, type TiradsQuiz } from "./types";

export const TIRADS_COURSE_DISCLAIMER =
  "Учебный конспект по классификации TI-RADS (СТРОМ, 2023). Не заменяет клинические рекомендации и протокол отделения. Интерпретация — специалист.";

export const TIRADS_COURSE_META = curriculumSchema.parse(curriculumJson) as TiradsCurriculum;
export const TIRADS_QUIZ: TiradsQuiz = quizSchema.parse(quizJson);

export function moduleTitleFromMarkdown(md: string): string {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  return line ? line.slice(2).trim() : "Модуль";
}

export function isModuleOutlineOnly(md: string): boolean {
  return /СТАТУС:\s*каркас/i.test(md) || /outline_only/i.test(md);
}
