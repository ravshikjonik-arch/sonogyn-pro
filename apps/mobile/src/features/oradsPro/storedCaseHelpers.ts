import { CDSS_SHORT_DISCLAIMER } from "@repo/clinical-tools";
import type { OradsUs2022Input, OradsUs2022Result } from "@repo/orads-us/pro";
import type { OradsInput, OradsResult } from "./types";
import type { StoredCase } from "./storage/oradsStorage";

export function isUs2022StoredCase(row: StoredCase): row is StoredCase & {
  version: "us2022";
  input: OradsUs2022Input;
  result: OradsUs2022Result;
} {
  return row.version === "us2022";
}

export function storedCaseCategory(row: StoredCase): number {
  if (isUs2022StoredCase(row)) return row.result.category ?? 0;
  return row.result.category;
}

export function storedCaseRiskLabel(row: StoredCase): string {
  if (isUs2022StoredCase(row)) return row.result.risk;
  return row.result.riskText;
}

export function storedCaseRecommendation(row: StoredCase): string {
  if (isUs2022StoredCase(row)) return row.result.management;
  return row.result.recommendation;
}

export function storedCaseIsCritical(row: StoredCase): boolean {
  const cat = storedCaseCategory(row);
  if (cat === 5) return true;
  if (isUs2022StoredCase(row)) {
    return row.input.extraSigns !== "none" && cat >= 4;
  }
  const pro = row as { input: OradsInput; result: OradsResult };
  return (!!pro.input.ascites && !!pro.input.peritonealNodules) || (!!pro.input.ascites && cat >= 4);
}

export function buildUnifiedReportPlain(input: OradsUs2022Input, result: OradsUs2022Result): string {
  const cat = result.category;
  const cycleLine =
    input.menopause === "pre" && input.cycleRegularity
      ? `Цикл: ${input.cycleRegularity === "regular" ? "регулярный" : "нерегулярный"}`
      : null;
  return [
    "O-RADS US v2022 · SonoGyn Pro",
    cat === null ? "Категория: не определена" : `O-RADS ${cat} · ROM ${result.risk}`,
    cycleLine,
    `Обоснование: ${result.rationale}`,
    `Тактика: ${result.management}`,
    result.warning ? `Примечание: ${result.warning}` : null,
    "",
    CDSS_SHORT_DISCLAIMER,
  ]
    .filter(Boolean)
    .join("\n");
}
