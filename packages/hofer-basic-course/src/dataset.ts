import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import curriculumJson from "../data/curriculum.json";
import quizJson from "../data/quiz/quiz.json";
import { curriculumSchema, quizSchema, type HoferCurriculum, type HoferQuiz } from "./types";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export const HOFER_COURSE_DISCLAIMER =
  "Учебный конспект по Хоферу (3-е изд., 2021). Не заменяет клинические рекомендации и протокол вашего отделения. Интерпретация — специалист.";

export const HOFER_COURSE_META = curriculumSchema.parse(curriculumJson) as HoferCurriculum;
export const HOFER_QUIZ: HoferQuiz = quizSchema.parse(quizJson);

const modulesDir = join(packageRoot, "data/modules");

export function listModuleIds(): string[] {
  return readdirSync(modulesDir)
    .filter((f: string) => f.endsWith(".md"))
    .map((f: string) => f.replace(/\.md$/, ""))
    .sort();
}

export function readModuleMarkdown(moduleId: string): string | null {
  const safe = moduleId.replace(/[^a-z0-9_]/gi, "");
  const path = join(modulesDir, `${safe}.md`);
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export function moduleTitleFromMarkdown(md: string): string {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  return line ? line.slice(2).trim() : "Модуль";
}

export function isModuleOutlineOnly(md: string): boolean {
  return /СТАТУС:\s*каркас/i.test(md) || /outline_only/i.test(md);
}
