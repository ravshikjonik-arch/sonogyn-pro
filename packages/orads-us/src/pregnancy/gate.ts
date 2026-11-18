import type { AdnexAssessmentContext } from "./types";

/** Можно ли вызывать движок O-RADS US (категории 0–5). */
export function isOradsUsStratificationAllowed(context: AdnexAssessmentContext): boolean {
  return context === "non_pregnant";
}

/**
 * Hard gate: при беременности результат стратификации O-RADS всегда «не применяется».
 * Не путать с O-RADS 0 (технически неполное исследование).
 */
export function pregnancyBlocksOradsCategory(context: AdnexAssessmentContext): boolean {
  return context === "pregnant";
}
