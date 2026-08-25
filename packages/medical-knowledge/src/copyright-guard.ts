export const COPYRIGHT_BLOCK_MESSAGE =
  "Я могу подготовить краткое структурированное резюме этой темы и указать источник, но не воспроизводить значительный фрагмент книги.";

const REPRODUCTION_REQUEST_PATTERNS = [
  /покажи\s+(?:всю|полную)\s+глав/i,
  /дай\s+(?:всю|полную)\s+страниц/i,
  /дай\s+страниц(?:ы|у)?\s*\d+\s*[-–—]\s*\d+/i,
  /покажи\s+страниц(?:ы|у)?\s*\d+\s*[-–—]\s*\d+/i,
  /покажи\s+в(?:есь|сю)\s+исходн/i,
  /весь\s+исходн(?:ый|ого)?\s+текст/i,
  /продолжи\s+(?:следующ(?:ий|его)\s+)?абзац/i,
  /перепиши\s+книг/i,
  /скопируй\s+книг/i,
  /весь\s+текст\s+глав/i,
  /полный\s+pdf/i,
  /download\s+pdf/i,
  /show\s+full\s+chapter/i,
  /page\s*\d+\s*[-–—]\s*\d+/i,
];

/** Detect sequential page-by-page reconstruction attempts within one query. */
const SEQUENTIAL_PAGE_PATTERN = /(?:страниц(?:а|ы|у)?|page)\s*#?\s*\d+/gi;

export type CopyrightGuardResult =
  | { allowed: true }
  | { allowed: false; reason: "reproduction_request" | "verbatim_too_long"; message: string };

export function assessCopyrightRequest(query: string): CopyrightGuardResult {
  const q = query.trim();
  if (REPRODUCTION_REQUEST_PATTERNS.some((re) => re.test(q))) {
    return { allowed: false, reason: "reproduction_request", message: COPYRIGHT_BLOCK_MESSAGE };
  }
  const pageRefs = q.match(SEQUENTIAL_PAGE_PATTERN) ?? [];
  if (pageRefs.length >= 2) {
    return { allowed: false, reason: "reproduction_request", message: COPYRIGHT_BLOCK_MESSAGE };
  }
  return { allowed: true };
}

/** Rough n-gram overlap guard between generated answer and a single source chunk. */
export function assessVerbatimOverlap(answer: string, sourceChunk: string, maxOverlapRatio = 0.35): CopyrightGuardResult {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const a = normalize(answer);
  const b = normalize(sourceChunk);
  if (!a || !b) return { allowed: true };

  const wordsA = a.split(" ");
  const wordsB = new Set(b.split(" "));
  if (wordsA.length < 24) return { allowed: true };

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap += 1;
  }
  const ratio = overlap / wordsA.length;
  if (ratio > maxOverlapRatio) {
    return { allowed: false, reason: "verbatim_too_long", message: COPYRIGHT_BLOCK_MESSAGE };
  }
  return { allowed: true };
}
