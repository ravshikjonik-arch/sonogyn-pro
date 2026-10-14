/** Heuristic guard against prompt-injection in user messages (not a substitute for tool ACL). */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(the\s+)?(system|developer)\s+prompt/i,
  /reveal\s+(the\s+)?(system|hidden|internal)\s+prompt/i,
  /you\s+are\s+now\s+(dan|jailbreak|unrestricted)/i,
  /\bsystem\s*:\s*/i,
  /<\s*system\s*>/i,
  /execute\s+tool\s*:\s*\w+/i,
  /call\s+function\s+\w+/i,
  /override\s+safety/i,
  /bypass\s+(phi|privacy|redaction)/i,
];

export type PromptInjectionResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export function detectPromptInjection(text: string): PromptInjectionResult {
  const reasons: string[] = [];
  const normalized = text.slice(0, 16_000);

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      reasons.push(pattern.source.slice(0, 48));
    }
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true };
}

export const PROMPT_INJECTION_BLOCK_MESSAGE =
  "Запрос отклонён: обнаружена попытка изменить системные инструкции. Переформулируйте клинический вопрос.";
