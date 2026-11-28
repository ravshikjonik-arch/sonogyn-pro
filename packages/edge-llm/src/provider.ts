/**
 * provider.ts — общий интерфейс LLM-провайдеров локального ИИ SonoGyn Pro
 * (AI_LOCAL_ARCHITECTURE.md §6.4) + парсер классификации с guardrails.
 *
 * Guardrails (обязательные, дублируют CalcContract):
 *  — LLM НЕ вычисляет и НЕ называет пороги; она только классифицирует интент,
 *    извлекает слоты и формулирует. Все числа — из движков, пороги — из шины знаний.
 *  — Неуверенность модели → intent "unknown" → детерминированный роутер как fallback.
 *  — Инструмент вне whitelist реестра → отклоняется.
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmChatRequest {
  messages: LlmMessage[];
  /** Просить у модели строго JSON (Ollama format:"json"). */
  json?: boolean;
  timeoutMs?: number;
}

export interface LlmReply {
  content: string;
  model?: string;
}

export interface LlmHealth {
  ok: boolean;
  models?: string[];
  reason?: string;
}

export interface LlmProvider {
  readonly model: string;
  chat(req: LlmChatRequest): Promise<LlmReply>;
  health(): Promise<LlmHealth>;
}

/* ---------- надёжный JSON ---------- */

/** Первый сбалансированный {...} в тексте (учёт строк и экранирования) — или undefined. */
export function extractJsonBlock(text: string): string | undefined {
  const start = text.indexOf("{");
  if (start < 0) return undefined;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return undefined;
}

export type SafeJson = { ok: true; value: unknown } | { ok: false };

export function safeParseJson(text: string): SafeJson {
  try {
    return { ok: true, value: JSON.parse(text.trim()) as unknown };
  } catch {
    const block = extractJsonBlock(text);
    if (!block) return { ok: false };
    try {
      return { ok: true, value: JSON.parse(block) as unknown };
    } catch {
      return { ok: false };
    }
  }
}

/* ---------- классификация ---------- */

const INTENTS = new Set(["calculate", "lookup_kr", "explain_term", "unknown"]);

export type ClassificationIntent = "calculate" | "lookup_kr" | "explain_term" | "unknown";

export interface Classification {
  intent: ClassificationIntent;
  tool?: string;
  slots?: Record<string, unknown>;
  normalized?: string;
}

export const CLASSIFY_SYSTEM_PROMPT = `Ты — классификатор запросов врача в клинической платформе SonoGyn Pro.
Строгие правила:
1. Ты НЕ вычисляешь, НЕ называешь пороги и НЕ даёшь медицинских интерпретаций.
2. Твоя задача — определить интент запроса и извлечь данные (слоты) из вопроса врача.
3. Верни ТОЛЬКО JSON без пояснений: {"intent":"calculate"|"lookup_kr"|"explain_term"|"unknown","tool":"<id из списка инструментов или опусти>","slots":{"имя_слота": значение},"normalized":"<краткая каноническая переформулировка запроса>"}
4. Значения слотов — только числа, логические или строки из допустимых options. Ничего не придумывай: нет данных — не включай слот.
5. Не уверена — intent "unknown".
6. Дисклеймер платформа добавит сама — ты его не пишешь.`;

/** Парс классификации: мусор → undefined (fallback на детерминированный роутер). */
export function parseClassification(content: string): Classification | undefined {
  const parsed = safeParseJson(content);
  if (!parsed.ok) return undefined;
  const v = parsed.value as Record<string, unknown>;
  const intentRaw = typeof v.intent === "string" ? v.intent : "";
  if (!INTENTS.has(intentRaw)) return undefined;
  const intent = intentRaw as ClassificationIntent;
  const tool = typeof v.tool === "string" && v.tool.trim().length > 0 ? v.tool.trim() : undefined;
  const slots: Record<string, unknown> = {};
  const raw = v.slots;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val === "number" || typeof val === "boolean" || typeof val === "string") {
        slots[k] = val;
      }
    }
  }
  return {
    intent,
    tool,
    slots,
    normalized: typeof v.normalized === "string" && v.normalized.length > 0 ? v.normalized : undefined,
  };
}

/* ---------- структурные описания (без cross-package импортов) ---------- */

export interface ToolSlotSummary {
  name: string;
  type: string;
  required: boolean;
  description: string;
  options?: Array<string | number>;
}

export interface ToolSummary {
  id: string;
  nosology: string;
  title: string;
  keywords?: string[];
  slots: ToolSlotSummary[];
}

/** Каталог инструментов для промта-классификатора (компактный). */
export function toolCatalogPrompt(tools: ToolSummary[]): string {
  return tools
    .map((t) => {
      const slots = t.slots
        .map((s) => `${s.name}(${s.type}${s.required ? "" : ", необяз."}${s.options ? `: ${s.options.join("|")}` : ""}) — ${s.description}`)
        .join("; ");
      return `- ${t.id} [${t.nosology}] «${t.title}»: слоты: ${slots || "нет"}`;
    })
    .join("\n");
}
