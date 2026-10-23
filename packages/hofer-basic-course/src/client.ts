import curriculumJson from "../data/curriculum.json";
import quizJson from "../data/quiz/quiz.json";
import { curriculumSchema, quizSchema, type HoferCurriculum, type HoferQuiz } from "./types";

export const HOFER_COURSE_DISCLAIMER =
  "Учебный конспект по Хоферу (3-е изд., 2021). Не заменяет клинические рекомендации и протокол вашего отделения. Интерпретация — специалист.";

export const HOFER_COURSE_META = curriculumSchema.parse(curriculumJson) as HoferCurriculum;
export const HOFER_QUIZ: HoferQuiz = quizSchema.parse(quizJson);

export function moduleTitleFromMarkdown(md: string): string {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  return line ? line.slice(2).trim() : "Модуль";
}

export function isModuleOutlineOnly(md: string): boolean {
  return /СТАТУС:\s*каркас/i.test(md) || /outline_only/i.test(md);
}
