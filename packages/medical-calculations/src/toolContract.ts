/**
 * toolContract — единый контракт «клинического мозга» SonoGyn Pro (изменение №8 / этап 1
 * платформенного ИИ, см. AI_PLATFORM_WIDE_V2.md).
 *
 * Принципы (обязательные):
 *  1. LLM не считает и не «вспоминает» пороги: модель извлекает слоты, движок считает,
 *     пороги и тактика приходят из evidence-чанков с атрибуцией.
 *  2. Каждый ответ = CalcContract: {result, chain, citations[{organization, document,
 *     year, status}], disclaimer} — «золотое правило» атрибуции INTEGRATION_MODELS.md.
 *  3. Не хватило слотов — контракт требует переспросить (missingSlots), не додумывать.
 *  4. «Справочная поддержка, не диагноз — решение за врачом» в каждом ответе.
 */

export interface Citation {
  /** Организация-источник (FMF, ACR, IOTA, LOINC, автор модели...). */
  organization: string;
  /** Документ/публикация. */
  document: string;
  /** Год публикации/версии. */
  year: number;
  /** Статус документа (действующая, пересмотр, учебный пересказ...). */
  status: string;
  /** Необязательная ссылка на источник (без PHI). */
  url?: string;
}

export type SlotType = "number" | "boolean" | "string" | "enum";

export interface SlotSpec {
  name: string;
  type: SlotType;
  required: boolean;
  /** Для type="enum" — допустимые значения. */
  options?: Array<string | number>;
  unit?: string;
  /** Русское описание слота — для подсказки LLM/врача, что вводить. */
  description: string;
}

export type ToolResultShape = Record<string, unknown>;

export interface ToolResult {
  ok: true;
  result: ToolResultShape;
  /** Человекочитаемая цепочка расчёта (как пришли к ответу). */
  chain?: string[];
  citations: Citation[];
  disclaimer: string;
  /** Красные флаги, которые ассистент обязан озвучить. */
  redFlags?: string[];
}

export interface ToolFailure {
  ok: false;
  /** unknown_tool | missing_slots | wrong_slot_type | insufficient_slots */
  error: "unknown_tool" | "missing_slots" | "wrong_slot_type" | "insufficient_slots";
  message: string;
  missingSlots?: string[];
}

/** Whitelist интентов оркестратора (AI_PLATFORM_WIDE_V2.md §2). */
export type AssistantIntent =
  | "calculate"
  | "lookup_kr"
  | "pubmed_search"
  | "image_checklist"
  | "draft_protocol"
  | "explain_term";

export interface ToolDefinition {
  /** Уникальный id: nosology_действие, напр. "obstetrics_dating_crl". */
  id: string;
  /** Нозология: obstetrics | adnexa | breast | thyroid | uterus | ... */
  nosology: string;
  title: string;
  /** Ключевые слова для роутера-LLM (мультиязычные). */
  keywords: string[];
  slots: SlotSpec[];
  run: (slots: Record<string, unknown>) => ToolResult | null;
}

/** Финальный контракт ответа ассистента — единый для всех нозологий и платформ. */
export interface CalcContract {
  intent: AssistantIntent;
  tool?: string;
  slots?: Record<string, unknown>;
  result?: ToolResultShape;
  chain?: string[];
  citations: Citation[];
  disclaimer: string;
  /** Слоты, которые нужно запросить у врача (модель переспрашивает). */
  missingSlots?: string[];
  /** Человекочитаемые подсказки по недостающим слотам (из SlotSpec.description). */
  missingSlotPrompts?: string[];
  notes?: string[];
  /** Vision V1: чеклист признаков лексикона — врач отмечает, движок считает. */
  checklist?: {
    nosology: string;
    title: string;
    items: Array<{ id: string; label: string }>;
    note?: string;
  };
}

export const STANDARD_DISCLAIMER =
  "Справочная поддержка для врачей. Не является диагнозом — решение за врачом.";

export type SlotValidation =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: "missing_slots" | "wrong_slot_type"; missingSlots?: string[]; message: string };

export function validateSlots(tool: ToolDefinition, slots: Record<string, unknown>): SlotValidation {
  const missing: string[] = [];
  const wrong: string[] = [];
  const value: Record<string, unknown> = {};
  for (const spec of tool.slots) {
    const raw = slots[spec.name];
    if (raw === undefined || raw === null || raw === "") {
      if (spec.required) missing.push(spec.name);
      continue;
    }
    if (spec.type === "number") {
      const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : raw;
      if (typeof n !== "number" || !Number.isFinite(n)) {
        wrong.push(spec.name);
        continue;
      }
      value[spec.name] = n;
    } else if (spec.type === "boolean") {
      if (typeof raw !== "boolean" && raw !== "true" && raw !== "false") {
        wrong.push(spec.name);
        continue;
      }
      value[spec.name] = typeof raw === "boolean" ? raw : raw === "true";
    } else if (spec.type === "enum") {
      const hit = (spec.options ?? []).some((o) => String(o) === String(raw));
      if (!hit) {
        wrong.push(spec.name);
        continue;
      }
      value[spec.name] = raw;
    } else {
      value[spec.name] = String(raw);
    }
  }
  if (missing.length > 0) {
    return {
      ok: false,
      error: "missing_slots",
      missingSlots: missing,
      message: "Нужны дополнительные параметры — уточните в следующем сообщении.",
    };
  }
  if (wrong.length > 0) {
    return {
      ok: false,
      error: "wrong_slot_type",
      missingSlots: wrong,
      message: "Проверьте числа и формулировки — не удалось разобрать часть ввода.",
    };
  }
  return { ok: true, value };
}
