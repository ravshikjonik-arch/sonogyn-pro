/**
 * Локальный полный корпус справочника фельдшера 2025.
 * Файлы: packages/medical-knowledge/data/emergency-corpus/
 * (в .gitignore — полный текст книги не уходит в git/Vercel).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CanonicalKnowledgeArticle } from "../types";

function corpusDir(): string {
  // packages/medical-knowledge/src/fixtures → ../../data/emergency-corpus
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "data", "emergency-corpus");
}

function readJsonArray(path: string): CanonicalKnowledgeArticle[] {
  if (!existsSync(path)) return [];
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as CanonicalKnowledgeArticle[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export type EmergencyCorpusStats = {
  available: boolean;
  topicArticles: number;
  pageArticles: number;
  dir: string;
};

let cached: CanonicalKnowledgeArticle[] | null = null;
let cachedStats: EmergencyCorpusStats | null = null;

function loadOcrPageArticles(dir: string): CanonicalKnowledgeArticle[] {
  const ocrRoot = join(dir, "ocr");
  if (!existsSync(ocrRoot)) return [];
  const out: CanonicalKnowledgeArticle[] = [];
  for (const book of ["skoraya", "neotlozhnaya"] as const) {
    out.push(...readJsonArray(join(ocrRoot, book, "page-articles.json")));
  }
  return out;
}

/** Все статьи корпуса (темы + страницы + OCR сканов) для движка помощника. */
export function loadEmergencyCorpusArticles(): CanonicalKnowledgeArticle[] {
  if (cached) return cached;
  const dir = corpusDir();
  const topics = readJsonArray(join(dir, "articles.json"));
  const pages = readJsonArray(join(dir, "page-articles.json"));
  const ocrPages = loadOcrPageArticles(dir);
  cached = [...topics, ...pages, ...ocrPages];
  cachedStats = {
    available: cached.length > 0,
    topicArticles: topics.length,
    pageArticles: pages.length + ocrPages.length,
    dir,
  };
  return cached;
}

export function getEmergencyCorpusStats(): EmergencyCorpusStats {
  if (!cachedStats) loadEmergencyCorpusArticles();
  return (
    cachedStats ?? {
      available: false,
      topicArticles: 0,
      pageArticles: 0,
      dir: corpusDir(),
    }
  );
}

/** Сброс кэша (тесты / после пересборки корпуса). */
export function resetEmergencyCorpusCache(): void {
  cached = null;
  cachedStats = null;
}
