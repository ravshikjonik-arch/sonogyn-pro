import type { SonogynStructuredResponse } from "./structured-response";
import type { AllowedAiToolName, ToolExecutionResult } from "./tools/schemas";

/**
 * Category shown to the physician comes from the SSOT engine result only. A category written by the model
 * (structured JSON or prose) is never displayed as calculated: it is either reconciled against the engine result
 * or marked "Не рассчитано клиническим движком".
 */

export type ClassificationSystem = "O-RADS US" | "BI-RADS" | "TI-RADS" | "ADNEX" | "IOTA" | "FMF";

const TOOLS_FOR_SYSTEM: Record<ClassificationSystem, AllowedAiToolName[]> = {
  "O-RADS US": ["calculate_orads"],
  "BI-RADS": ["calculate_birads"],
  "TI-RADS": ["calculate_tirads"],
  ADNEX: ["calculate_adnex"],
  IOTA: ["calculate_adnex", "calculate_lr2", "calculate_srrisk"],
  FMF: ["assess_fmf_screening"],
};

const TOOL_LABELS: Record<AllowedAiToolName, string> = {
  calculate_orads: "O-RADS",
  calculate_birads: "BI-RADS",
  calculate_tirads: "ACR TI-RADS",
  calculate_adnex: "IOTA ADNEX",
  calculate_lr2: "IOTA LR2",
  calculate_srrisk: "IOTA Simple Rules Risk",
  assess_fmf_screening: "FMF",
};

export const NOT_CALCULATED_LABEL = "Не рассчитано клиническим движком";

const CLAIM_PATTERNS: Array<{ system: ClassificationSystem; re: RegExp }> = [
  { system: "O-RADS US", re: /O-?RADS\s*(?:US\s*)?([0-5])\b/gi },
  { system: "BI-RADS", re: /BI-?RADS\s*(?:US\s*)?([0-6])\s*([ABC])?\b/gi },
  { system: "TI-RADS", re: /\bTR\s*([1-5])\b|TI-?RADS\s*(?:ACR\s*)?([1-5])\b/gi },
];

/** Latest result per tool in call order (a later call supersedes an earlier one). */
function latestToolResults(tools: readonly ToolExecutionResult[]): ToolExecutionResult[] {
  const latest = new Map<AllowedAiToolName, ToolExecutionResult>();
  for (const tool of tools) latest.set(tool.tool, tool);
  return [...latest.values()];
}

/** Normalised comparable code of a category string for a system (e.g. "4", "4A"); null if not parseable. */
export function normalizeCategory(system: ClassificationSystem, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (system === "O-RADS US") return s.match(/([0-5])\b/)?.[1] ?? null;
  if (system === "BI-RADS") {
    const m = s.match(/([0-6])\s*([ABC])?\b/i);
    return m ? `${m[1]}${(m[2] ?? "").toUpperCase()}` : null;
  }
  if (system === "TI-RADS") return s.match(/([1-5])\b/)?.[1] ?? null;
  if (system === "ADNEX" || system === "IOTA") {
    const m = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
    return m ? m[1]!.replace(",", ".") : null;
  }
  return null;
}

export function detectSystem(category: string | null | undefined): ClassificationSystem | undefined {
  if (!category) return undefined;
  for (const { system, re } of CLAIM_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(category)) return system;
  }
  return undefined;
}

/** Category label produced by the engine for a completed result; null when there is no engine category. */
export function engineCategoryLabel(tool: ToolExecutionResult): string | null {
  const r = tool.result;
  if (!tool.ok || !r) return null;
  switch (tool.tool) {
    case "calculate_orads":
      return r.category != null ? `O-RADS ${String(r.category)}` : null;
    case "calculate_birads":
    case "calculate_tirads":
      return r.category != null ? String(r.category) : null;
    case "calculate_adnex":
    case "calculate_lr2":
    case "calculate_srrisk":
      return typeof r.malignancyRisk === "number" ? `${(r.malignancyRisk * 100).toFixed(1)}%` : null;
    default:
      return null;
  }
}

function matches(system: ClassificationSystem, model: string, engine: string): boolean | null {
  const a = normalizeCategory(system, model);
  const b = normalizeCategory(system, engine);
  if (a === null || b === null) return null;
  if (system === "ADNEX" || system === "IOTA") return Math.abs(Number(a) - Number(b)) <= 0.5;
  return a === b;
}

export type NotCalculatedReason =
  | "no_engine_result"
  | "engine_not_completed"
  /** The engine returns measurements, not a category (FMF percentiles). */
  | "no_engine_category";

export type CategoryView =
  | {
      kind: "engine";
      system: ClassificationSystem;
      tool: AllowedAiToolName;
      label: string;
      provisional: boolean;
      modelCategory?: string;
      /** true when the model's category differs from the engine result. */
      mismatch: boolean;
    }
  | { kind: "not_calculated"; system?: ClassificationSystem; modelCategory?: string; reason: NotCalculatedReason };

const REASON_TEXT: Record<NotCalculatedReason, string> = {
  no_engine_result: "клинический движок не запускался",
  engine_not_completed: "расчёт движком не завершён (не хватает данных)",
  no_engine_category: "движок не присваивает категорию — см. значения в карточке инструмента",
};

export function notCalculatedReasonText(reason: NotCalculatedReason): string {
  return REASON_TEXT[reason];
}

function viewForSystem(
  system: ClassificationSystem | undefined,
  modelCategory: string | undefined,
  tools: readonly ToolExecutionResult[],
): CategoryView {
  if (!system) return { kind: "not_calculated", modelCategory, reason: "no_engine_result" };
  const candidates = latestToolResults(tools).filter((t) => TOOLS_FOR_SYSTEM[system].includes(t.tool));
  for (const tool of candidates) {
    const label = engineCategoryLabel(tool);
    if (label) {
      const cmp = modelCategory ? matches(system, modelCategory, label) : null;
      return {
        kind: "engine",
        system,
        tool: tool.tool,
        label,
        provisional: false,
        ...(modelCategory ? { modelCategory } : {}),
        mismatch: cmp === false,
      };
    }
  }
  return {
    kind: "not_calculated",
    system,
    modelCategory,
    reason: candidates.length ? "engine_not_completed" : "no_engine_result",
  };
}

/** View of the `sonogyn-json` card category; null when the card carries no classification. */
export function reconcileStructuredCategory(
  structured: SonogynStructuredResponse,
  tools: readonly ToolExecutionResult[],
): CategoryView | null {
  const modelCategory = structured.category?.trim() || undefined;
  const declared = structured.classification_system && structured.classification_system !== "none" ? structured.classification_system : undefined;
  const system = (declared as ClassificationSystem | undefined) ?? detectSystem(modelCategory);
  if (!system && !modelCategory) return null;
  if (system === "FMF") {
    if (!modelCategory) return null;
    const fmfRan = latestToolResults(tools).some((t) => t.tool === "assess_fmf_screening" && t.ok);
    return { kind: "not_calculated", system, modelCategory, reason: fmfRan ? "no_engine_category" : "no_engine_result" };
  }
  return viewForSystem(system, modelCategory, tools);
}

export type TextClaimWarning = {
  system: ClassificationSystem;
  claim: string;
  kind: "not_calculated" | "mismatch";
  engineLabel?: string;
  reason?: NotCalculatedReason;
};

/**
 * Auxiliary check of categories written in prose that no completed engine result supports, or that contradict it.
 * The card category above never depends on this.
 */
export function findTextCategoryClaims(text: string, tools: readonly ToolExecutionResult[]): TextClaimWarning[] {
  const out: TextClaimWarning[] = [];
  const seen = new Set<string>();
  for (const { system, re } of CLAIM_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const claim = m[0].trim();
      const key = `${system}|${normalizeCategory(system, claim)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const view = viewForSystem(system, claim, tools);
      if (view.kind === "not_calculated") out.push({ system, claim, kind: "not_calculated", reason: view.reason });
      else if (view.mismatch) out.push({ system, claim, kind: "mismatch", engineLabel: view.label });
    }
  }
  return out;
}

export function describeTextClaim(w: TextClaimWarning): string {
  return w.kind === "mismatch"
    ? `В тексте ответа указано «${w.claim}», но клинический движок рассчитал ${w.engineLabel}. Используйте результат движка.`
    : `«${w.claim}» в тексте ответа — ${NOT_CALCULATED_LABEL.toLowerCase()} (${notCalculatedReasonText(w.reason ?? "no_engine_result")}).`;
}

export function toolLabel(tool: AllowedAiToolName): string {
  return TOOL_LABELS[tool];
}
