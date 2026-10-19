import sources from "../data/sources.json";

import type { OradsCompareResult } from "./types";

/** IOTA vs O-RADS US v2022 — product concordance at 10% malignancy risk. */
export const IOTA_ORADS_RISK_THRESHOLD = sources.oradsCompareThreshold.value as number;

export type OradsCategoryInput = {
  categoryNumber: number | null | undefined;
};

function formatRiskPct(risk: number): string {
  return (risk * 100).toFixed(1);
}

function isOradsLowRisk(category: number): boolean {
  return category >= 1 && category <= 3;
}

function isOradsHighRisk(category: number): boolean {
  return category >= 4 && category <= 5;
}

export function compareIotaRiskWithOrads(
  iotaMalignancyRisk: number,
  orads: OradsCategoryInput,
): OradsCompareResult {
  const risk = Math.min(1, Math.max(0, iotaMalignancyRisk));
  const cat = orads.categoryNumber;
  const riskPct = formatRiskPct(risk);

  if (cat == null || cat === 0 || !Number.isFinite(cat)) {
    return {
      status: "missing_orads",
      iotaMalignancyRisk: risk,
      oradsCategory: cat ?? null,
      messageKey: "iota.compare.missing_orads",
    };
  }

  const iotaHigh = risk >= IOTA_ORADS_RISK_THRESHOLD;
  const oradsHigh = isOradsHighRisk(cat);
  const oradsLow = isOradsLowRisk(cat);

  if ((iotaHigh && oradsHigh) || (!iotaHigh && oradsLow)) {
    return {
      status: "concordant",
      iotaMalignancyRisk: risk,
      oradsCategory: cat,
      messageKey: "iota.compare.concordant",
    };
  }
  if (iotaHigh && oradsLow) {
    return {
      status: "discordant_iota_higher",
      iotaMalignancyRisk: risk,
      oradsCategory: cat,
      messageKey: "iota.compare.discordant_iota_higher",
    };
  }
  return {
    status: "discordant_orads_higher",
    iotaMalignancyRisk: risk,
    oradsCategory: cat,
    messageKey: "iota.compare.discordant_orads_higher",
  };
}

/** Helper when `OradsTreeResult` is available from `@repo/orads-us`. */
export function compareAdnexWithOradsTree(
  adnexMalignancyRisk: number,
  tree: { categoryNumber: number },
): OradsCompareResult {
  return compareIotaRiskWithOrads(adnexMalignancyRisk, { categoryNumber: tree.categoryNumber });
}
