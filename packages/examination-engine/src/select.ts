import type { QuizLevel, QuizQuestion } from "@repo/education-quiz";

/** Deterministic mulberry32 PRNG (0..1). */
export function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export function filterQuestionsForExam(
  questions: QuizQuestion[],
  level: QuizLevel | "all",
  preferImageQuestions: boolean,
): QuizQuestion[] {
  const byLevel = level === "all" ? questions : questions.filter((q) => q.level === level);
  if (!preferImageQuestions) return byLevel;
  const withImage = byLevel.filter((q) => q.media?.type === "image");
  const without = byLevel.filter((q) => q.media?.type !== "image");
  return [...withImage, ...without];
}

export function pickExamQuestions(
  questions: QuizQuestion[],
  count: number,
  seed: number,
  preferImageQuestions = false,
): QuizQuestion[] {
  if (count <= 0) return [];
  const random = createSeededRandom(seed);
  if (!preferImageQuestions) {
    const pool = [...questions];
    shuffleInPlace(pool, random);
    return pool.slice(0, Math.min(count, pool.length));
  }
  const withImage = questions.filter((q) => q.media?.type === "image");
  const without = questions.filter((q) => q.media?.type !== "image");
  shuffleInPlace(withImage, random);
  shuffleInPlace(without, random);
  return [...withImage, ...without].slice(0, Math.min(count, questions.length));
}

export function defaultQuestionCount(
  mode: "quick" | "certification" | "mock",
  available: number,
  quickCount: number,
  override?: number,
): number {
  if (override != null && override > 0) return Math.min(override, available);
  if (mode === "quick") return Math.min(quickCount, available);
  return available;
}
