import { calculateCinRisk } from "@repo/ifcpc-expert";

import type { ColposcopyQuality, CpiCaseInput, CpiRiskOutput } from "../domain/schemas";
import { evaluateHpvRisk, hpvToLegacyFlags } from "./hpv-engine";
import { histologyToPriorBiopsy } from "./histology-engine";

/** Part 6 — Risk calculator with confidence score. */
export function calculateCpiRisk(input: CpiCaseInput, mergedFindingIds: string[]): CpiRiskOutput {
  const hpvFlags = hpvToLegacyFlags(input.hpv);
  const hpvProfile = evaluateHpvRisk(input.hpv);

  const cytology =
    input.cytology.result === "ais" || input.cytology.result === "scc"
      ? "agc"
      : input.cytology.result;

  const base = calculateCinRisk({
    age: input.clinical.age,
    hpvStatus: hpvFlags.hpvStatus === "not_tested" ? "positive" : hpvFlags.hpvStatus,
    hpv16Positive: hpvFlags.hpv16Positive,
    hpv18Positive: hpvFlags.hpv18Positive,
    otherHrHpvPositive: hpvFlags.otherHrHpvPositive || hpvFlags.hpv3133455258Positive,
    cytology: cytology as "nilm" | "ascus" | "lsil" | "asc_h" | "hsil" | "agc" | "unsatisfactory",
    transformationZoneTypeId: input.colposcopy.transformationZoneTypeId,
    ifcpcFindingSignIds: mergedFindingIds,
    priorBiopsy: histologyToPriorBiopsy(input.histology),
    immunodeficiency: input.clinical.immunosuppression,
    pregnancy: input.clinical.pregnancy,
    priorCinTreatment: input.clinical.priorCinTreatment,
  });

  let cin2plus = base.cin2plus + hpvProfile.cin2plusModifier;
  let invasion = base.invasion;
  if (input.clinical.smoking) {
    cin2plus += 0.03;
    invasion += 0.02;
  }
  if (input.histology.result === "invasive" || input.histology.result === "microinvasive") {
    invasion = Math.max(invasion, 0.5);
  }

  cin2plus = clamp01(cin2plus);
  invasion = clamp01(invasion);

  const dataCompleteness =
    (input.swede ? 1 : 0.85) *
    (input.hpv.status !== "not_tested" ? 1 : 0.7) *
    (input.histology.result !== "pending" ? 1 : 0.8);

  return {
    cin1Risk: clamp01(base.cin1),
    cin2PlusRisk: cin2plus,
    cin3PlusRisk: clamp01(base.cin3plus),
    aisRisk: clamp01(base.ais),
    invasionRisk: invasion,
    confidenceScore: clamp01(0.55 + dataCompleteness * 0.4),
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Part 9 — Quality score 0–100. */
export function calculateQualityScore(q: ColposcopyQuality): {
  score: number;
  interpretation: string;
} {
  let score = 0;
  if (q.photoPreAcetic) score += 10;
  if (q.photoPostAcetic) score += 15;
  if (q.photoPostSchiller) score += 10;
  if (q.scjDocumented) score += 15;
  if (q.tzDocumented) score += 15;
  if (q.aceticAcidAssessment) score += 15;
  if (q.iodineTestPerformed) score += 10;
  if (q.lesionDocumented) score += 5;
  if (q.adequacyDocumented) score += 5;

  const interpretation =
    score >= 90
      ? "Expert (90–100)"
      : score >= 70
        ? "Good (70–89)"
        : score >= 50
          ? "Acceptable (50–69)"
          : "Incomplete (<50)";

  return { score, interpretation };
}
