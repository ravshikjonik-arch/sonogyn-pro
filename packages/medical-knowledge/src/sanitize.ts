import { createHash } from "node:crypto";

export type SanitizationHit = {
  label: string;
  match: string;
};

export type SanitizeMedicalSourceResult = {
  cleanText: string;
  detectedSensitiveData: SanitizationHit[];
  requiresManualReview: boolean;
  sanitizationLog: string[];
};

const SENSITIVE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { label: "phone", pattern: /(?:\+7|8)\s*(?:\(?\d{3}\)?[\s-]*)\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/g },
  { label: "snils", pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g },
  { label: "passport", pattern: /\b(?:паспорт|серия\s+и\s+номер)\D{0,20}\d{4}\s?\d{6}\b/gi },
  { label: "oms_policy", pattern: /\b(?:омс|полис)\D{0,20}\d{12,16}\b/gi },
  { label: "medical_record", pattern: /\b(?:история\s+болезни|мед(?:ицинск(?:ая|ой))?\s+карта|номер\s+карты)\D{0,20}\d{4,}\b/gi },
  { label: "dob", pattern: /\b(?:дата\s+рождения|др|dob)\D{0,20}\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/gi },
  { label: "fio_triple", pattern: /\b[А-ЯЁ][а-яё]{1,30}\s+[А-ЯЁ][а-яё]{1,30}\s+[А-ЯЁ][а-яё]{1,30}\b/g },
  { label: "study_uid", pattern: /\b\d\.\d+\.\d+\.\d+(?:\.\d+)*\.\d+\b/g },
  { label: "address", pattern: /\b(?:ул\.|улица|пр\.|проспект|д\.|дом)\s+[А-Яа-я0-9\s.,-]{3,40}\b/gi },
];

const PROMPT_INJECTION_MARKERS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now/i,
  /reveal\s+the\s+book/i,
];

/**
 * Sanitize extracted source text for RAG/editorial review.
 * Original source_file bytes are never modified — this operates on derived text only.
 */
export function sanitizeMedicalSource(rawText: string): SanitizeMedicalSourceResult {
  const log: string[] = [];
  const detected: SanitizationHit[] = [];
  let cleanText = rawText;

  for (const { label, pattern } of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = rawText.match(pattern) ?? [];
    for (const match of matches) {
      detected.push({ label, match });
    }
    if (matches.length > 0) {
      cleanText = cleanText.replace(pattern, `[REDACTED:${label}]`);
      log.push(`redacted:${label}:${matches.length}`);
    }
  }

  for (const marker of PROMPT_INJECTION_MARKERS) {
    if (marker.test(rawText)) {
      log.push(`prompt_injection_marker:${marker.source}`);
      cleanText = cleanText.replace(marker, "[SOURCE_CONTENT]");
    }
  }

  const requiresManualReview = detected.length > 0 || log.some((l) => l.startsWith("prompt_injection"));

  if (requiresManualReview) {
    log.push("requires_manual_review=true");
  }

  return {
    cleanText: cleanText.trim(),
    detectedSensitiveData: detected,
    requiresManualReview,
    sanitizationLog: log,
  };
}

export function hashSourceContent(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function isPromptInjectionLike(text: string): boolean {
  return PROMPT_INJECTION_MARKERS.some((re) => re.test(text));
}

/** Treat vault chunk content as untrusted SOURCE CONTENT, never as instructions. */
export function wrapUntrustedSourceContent(text: string): string {
  return `[SOURCE_CONTENT_BEGIN]\n${text}\n[SOURCE_CONTENT_END]`;
}
