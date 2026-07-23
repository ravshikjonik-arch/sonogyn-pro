import { runCpiClinicalDecision, type CpiGuidelineSource, type CpiPatientInput } from "@repo/cervical-pathology-intelligence";

import type { CpiCaseInput, CpiClinicalAction, CpiEvaluationResult } from "../domain/schemas";
import { CPI_ACTION_LABELS } from "../domain";
import { evaluateBethesdaTriage } from "./bethesda-engine";
import { evaluateHistologyProgression } from "./histology-engine";
import { hpvToLegacyFlags } from "./hpv-engine";

/** Maps legacy CPI intelligence actions → enterprise CDS action set. */
const ACTION_MAP: Record<string, CpiClinicalAction> = {
  observation: "observation",
  targeted_biopsy: "targeted_biopsy",
  ecc: "ecc",
  lletz: "lletz",
  conization: "cold_knife_conization",
  repeat_colposcopy: "repeat_colposcopy",
  hpv_test_12mo: "repeat_hpv",
  oncology_referral: "referral_oncologist",
};

function toCpiPatientInput(input: CpiCaseInput, mergedFindingIds: string[]): CpiPatientInput {
  const hpv = hpvToLegacyFlags(input.hpv);
  const cyt =
    input.cytology.result === "ais" || input.cytology.result === "scc"
      ? "agc"
      : input.cytology.result;

  return {
    age: input.clinical.age,
    pregnancy: input.clinical.pregnancy,
    immunodeficiency: input.clinical.immunosuppression,
    adequacyId: input.colposcopy.adequacyId,
    scjVisibilityId: input.colposcopy.scjVisibilityId,
    transformationZoneTypeId: input.colposcopy.transformationZoneTypeId,
    ifcpcFindingSignIds: mergedFindingIds,
    hpvStatus: hpv.hpvStatus === "not_tested" ? "positive" : hpv.hpvStatus,
    hpv16Positive: hpv.hpv16Positive,
    hpv18Positive: hpv.hpv18Positive,
    hpv3133455258Positive: hpv.hpv3133455258Positive,
    otherHrHpvPositive: hpv.otherHrHpvPositive || hpv.hpv3133455258Positive,
    hpv565966Positive: hpv.hpv565966Positive ?? false,
    collectionMethod: hpv.collectionMethod ?? "clinician",
    viralLoad: input.hpv.viralLoad,
    cytology: cyt as CpiPatientInput["cytology"],
    dualStainResult: input.cytology.dualStainResult ?? "not_done",
    glandularSuspicion: input.clinical.glandularSuspicion,
    endocervicalComponentPresent: input.cytology.endocervicalComponent ?? null,
    suspectedGlandularLesion: input.clinical.suspectedGlandularLesion,
    priorBiopsy: input.histology.result === "pending" || input.histology.result === "none"
      ? "none"
      : input.histology.result === "microinvasive" || input.histology.result === "invasive"
        ? "invasion"
        : input.histology.result,
    priorCinTreatment: input.clinical.priorCinTreatment,
    currentBiopsyResult:
      input.histology.result === "pending" || input.histology.result === "none"
        ? "none"
        : input.histology.result === "microinvasive" || input.histology.result === "invasive"
          ? "invasion"
          : input.histology.result,
    quality: input.quality
      ? {
          photoPreAcetic: input.quality.photoPreAcetic,
          photoPostAcetic: input.quality.photoPostAcetic,
          photoPostSchiller: input.quality.photoPostSchiller,
          tzDocumented: input.quality.tzDocumented,
          adequacyDocumented: input.quality.adequacyDocumented,
          scjDocumented: input.quality.scjDocumented,
        }
      : undefined,
  };
}

/** Part 7 — Clinical Decision Support with extended action vocabulary. */
export function runClinicalDecisionSupport(
  input: CpiCaseInput,
  mergedFindingIds: string[],
  risk: CpiEvaluationResult["risk"],
): Pick<CpiEvaluationResult, "actions" | "explanation"> {
  const bethesda = evaluateBethesdaTriage(input.cytology, input.hpv, input.colposcopy);
  const histology = evaluateHistologyProgression(input.histology);
  const cpiDecision = runCpiClinicalDecision(toCpiPatientInput(input, mergedFindingIds));

  const actionsMap = new Map<
    CpiClinicalAction,
    CpiEvaluationResult["actions"][number]
  >();

  for (const a of cpiDecision.actions) {
    const mapped = ACTION_MAP[a.action];
    if (!mapped) continue;
    actionsMap.set(mapped, {
      action: mapped,
      labelRu: CPI_ACTION_LABELS[mapped],
      priority: a.priority,
      rationale: a.rationale,
      evidence: bethesda.evidence,
      references: a.sources.map((s: CpiGuidelineSource) => ({
        id: s.id,
        organization: s.organization,
        title: s.title,
        year: s.year,
        citation: s.citation,
      })),
    });
  }

  if (bethesda.biopsyThreshold === "mandatory" && risk.cin2PlusRisk >= 0.15) {
    actionsMap.set("targeted_biopsy", {
      action: "targeted_biopsy",
      labelRu: CPI_ACTION_LABELS.targeted_biopsy,
      priority: "primary",
      rationale: bethesda.summary,
      evidence: bethesda.evidence,
      references: cpiDecision.explanation.sources.map((s: CpiGuidelineSource) => ({
        id: s.id,
        organization: s.organization,
        title: s.title,
        year: s.year,
        citation: s.citation,
      })),
    });
  }

  if (risk.cin3PlusRisk >= 0.25) {
    actionsMap.set("lletz", {
      action: "lletz",
      labelRu: CPI_ACTION_LABELS.lletz,
      priority: "primary",
      rationale: "CIN3+ risk elevated — excisional treatment after histologic confirmation.",
      evidence: histology.evidence,
      references: cpiDecision.explanation.sources.map((s: CpiGuidelineSource) => ({
        id: s.id,
        organization: s.organization,
        title: s.title,
        year: s.year,
        citation: s.citation,
      })),
    });
  }

  if (input.colposcopy.transformationZoneTypeId === "tz3") {
    actionsMap.set("ecc", {
      action: "ecc",
      labelRu: CPI_ACTION_LABELS.ecc,
      priority: "primary",
      rationale: cpiDecision.tz3Alert ?? "TZ3 — ECC recommended.",
      evidence: ["IFCPC 2011 TZ3", "ASCCP 2019"],
      references: [],
    });
  }

  if (risk.cin2PlusRisk >= 0.35 && actionsMap.has("targeted_biopsy")) {
    actionsMap.set("multiple_biopsies", {
      action: "multiple_biopsies",
      labelRu: CPI_ACTION_LABELS.multiple_biopsies,
      priority: "conditional",
      rationale: "Large/multifocal lesion — consider 2–4 quadrant biopsies.",
      evidence: ["Swede Score / IFCPC major"],
      references: [],
    });
  }

  if (input.cytology.result === "unsatisfactory") {
    actionsMap.set("repeat_cytology", {
      action: "repeat_cytology",
      labelRu: CPI_ACTION_LABELS.repeat_cytology,
      priority: "primary",
      rationale: "Repeat cytology in 2–4 months (Bethesda).",
      evidence: bethesda.evidence,
      references: [],
    });
  }

  const actions = [...actionsMap.values()];
  const explanation = [
    cpiDecision.explanation.headline,
    cpiDecision.explanation.narrative,
    bethesda.summary,
    `Histology stage: ${histology.stage}.`,
  ].join(" ");

  return { actions, explanation };
}
