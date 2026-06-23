import { calculateCinRisk } from "@repo/ifcpc-expert";

import type { CpiPatientInput, CpiRiskBand } from "../types";

export type CpiEnrichedContext = {
  input: CpiPatientInput;
  flags: {
    invasionSignsPresent: boolean;
    ifcpcGrade1Count: number;
    ifcpcGrade2Count: number;
    glandularPathway: boolean;
    tz3HighRisk: boolean;
  };
  risk: {
    cin1: number;
    cin2: number;
    cin3: number;
    ais: number;
    invasion: number;
    cin2plus: number;
    cin3plus: number;
  };
  hpv: { riskBand: CpiRiskBand; label: string };
  colposcopy: { conclusion: string; riskCategory: CpiRiskBand };
  combinedRiskBand: CpiRiskBand;
  tz3Alert: string | null;
  glandularAlert: string | null;
  quality: { score: number; label: string } | null;
};

const INVASION_SIGN_IDS = new Set([
  "atypical_vessels",
  "necrosis",
  "exophytic_lesion",
  "ulcerative_defect",
]);

function countIfcpcSection(ids: string[], sectionId: string): number {
  return ids.filter((id) => {
    if (sectionId === "suspicious_invasion") return INVASION_SIGN_IDS.has(id);
    if (sectionId === "abnormal_grade1")
      return ["thin_acetowhite", "fine_mosaic", "fine_punctation"].includes(id);
    if (sectionId === "abnormal_grade2")
      return [
        "dense_acetowhite",
        "coarse_mosaic",
        "coarse_punctation",
        "sharp_border",
        "inner_border_sign",
        "ridge_sign",
        "cuffed_crypt_orifices",
      ].includes(id);
    return false;
  }).length;
}

function bandFromCin2plus(p: number): CpiRiskBand {
  if (p >= 0.6) return "very_high";
  if (p >= 0.35) return "high";
  if (p >= 0.15) return "moderate";
  if (p >= 0.05) return "low";
  return "very_low";
}

function bandFromHpv(input: CpiPatientInput): { riskBand: CpiRiskBand; label: string } {
  if (input.hpv16Positive && (input.cytology === "hsil" || input.cytology === "asc_h"))
    return { riskBand: "very_high", label: "HPV16 + HSIL/ASC-H" };
  if (input.hpv16Positive) return { riskBand: "high", label: "HPV16+" };
  if (input.hpv18Positive) return { riskBand: "high", label: "HPV18+ (железистый маршрут)" };
  if (input.hpv3133455258Positive) return { riskBand: "moderate", label: "HPV 31/33/45/52/58+" };
  if (input.hpvStatus === "negative" && input.cytology === "lsil")
    return { riskBand: "low", label: "LSIL + HPV(−)" };
  if (input.hpvStatus === "negative") return { riskBand: "very_low", label: "HPV(−)" };
  if (input.hpvStatus === "positive") return { riskBand: "moderate", label: "HPV+" };
  return { riskBand: "low", label: "HPV не тестировали" };
}

function buildColposcopyConclusion(input: CpiPatientInput, grade2: number, invasion: boolean): string {
  const parts: string[] = [];
  parts.push(`TZ ${input.transformationZoneTypeId.toUpperCase().replace("TZ", "TZ")}.`);
  if (input.scjVisibilityId === "scj_not_visible") parts.push("SCJ не визуализируется.");
  if (grade2 > 0) parts.push(`Major IFCPC-признаки: ${grade2}.`);
  if (invasion) parts.push("Признаки, подозрительные на инвазию.");
  if (input.adequacyId === "adequacy_unsatisfactory") parts.push("Исследование неадекватно.");
  if (parts.length === 1 && grade2 === 0 && !invasion)
    parts.push("Выраженных major-признаков не описано.");
  return parts.join(" ");
}

function computeQuality(input: CpiPatientInput): { score: number; label: string } | null {
  const q = input.quality;
  if (!q) return null;
  let score = 0;
  if (q.photoPreAcetic) score += 15;
  if (q.photoPostAcetic) score += 25;
  if (q.photoPostSchiller) score += 15;
  if (q.tzDocumented) score += 20;
  if (q.adequacyDocumented) score += 15;
  if (q.scjDocumented) score += 10;
  const label = score >= 90 ? "Экспертный протокол" : score >= 70 ? "Хороший" : "Неполный";
  return { score, label };
}

function buildTz3Alert(input: CpiPatientInput): string | null {
  if (input.transformationZoneTypeId !== "tz3" && input.scjVisibilityId !== "scj_not_visible") return null;
  const highScreen =
    input.hpv16Positive ||
    input.cytology === "hsil" ||
    input.cytology === "asc_h" ||
    input.cytology === "agc";
  if (highScreen) {
    return "Высокий риск пропуска CIN3+/AIS. Рассмотреть ECC или диагностическую excision (ASCCP/IFCPC).";
  }
  return "TZ3/SCJ не видна — ограниченная оценка; ECC по показаниям скрининга.";
}

function buildGlandularAlert(input: CpiPatientInput): string | null {
  if (
    input.cytology === "agc" ||
    input.cytology === "ais" ||
    input.glandularSuspicion !== "none" ||
    input.suspectedGlandularLesion
  ) {
    return "Железистый маршрут: ECC + excision при AGC favor neoplasia / AIS (ASCCP).";
  }
  if (input.hpv18Positive && input.endocervicalComponentPresent) {
    return "HPV18 + эндоцервикальный компонент — усиленный железистый triage.";
  }
  return null;
}

/** Blocks 1–5, 7–8: enrich raw input into evaluation context. */
export function enrichCpiContext(input: CpiPatientInput): CpiEnrichedContext {
  const grade1 = countIfcpcSection(input.ifcpcFindingSignIds, "abnormal_grade1");
  const grade2 = countIfcpcSection(input.ifcpcFindingSignIds, "abnormal_grade2");
  const invasionCount = countIfcpcSection(input.ifcpcFindingSignIds, "suspicious_invasion");
  const invasionSignsPresent = invasionCount > 0;

  const glandularPathway =
    input.cytology === "agc" ||
    input.cytology === "ais" ||
    input.glandularSuspicion !== "none" ||
    input.suspectedGlandularLesion ||
    input.hpv18Positive;

  const tz3HighRisk =
    (input.transformationZoneTypeId === "tz3" || input.scjVisibilityId === "scj_not_visible") &&
    (input.hpv16Positive || input.cytology === "hsil" || input.cytology === "asc_h");

  const cytologyForRisk =
    input.cytology === "ais" ? "agc" : input.cytology;

  const riskResult = calculateCinRisk({
    age: input.age,
    hpvStatus: input.hpvStatus === "not_tested" ? "positive" : input.hpvStatus,
    hpv16Positive: input.hpv16Positive,
    hpv18Positive: input.hpv18Positive,
    otherHrHpvPositive: input.otherHrHpvPositive || input.hpv3133455258Positive,
    cytology: cytologyForRisk as "nilm" | "ascus" | "lsil" | "asc_h" | "hsil" | "agc" | "unsatisfactory",
    transformationZoneTypeId: input.transformationZoneTypeId,
    ifcpcFindingSignIds: input.ifcpcFindingSignIds,
    priorBiopsy: input.priorBiopsy,
    immunodeficiency: input.immunodeficiency,
    pregnancy: input.pregnancy,
    priorCinTreatment: input.priorCinTreatment,
  });

  const hpv = bandFromHpv(input);
  const colposcopyRiskCategory: CpiRiskBand = invasionSignsPresent
    ? "critical"
    : bandFromCin2plus(riskResult.cin2plus);

  let combinedBand = bandFromCin2plus(riskResult.cin2plus);
  if (invasionSignsPresent || riskResult.invasion >= 0.05) combinedBand = "critical";
  else if (hpv.riskBand === "very_high" || colposcopyRiskCategory === "very_high") combinedBand = "very_high";
  else if (hpv.riskBand === "high" || colposcopyRiskCategory === "high") combinedBand = "high";

  return {
    input,
    flags: {
      invasionSignsPresent,
      ifcpcGrade1Count: grade1,
      ifcpcGrade2Count: grade2,
      glandularPathway,
      tz3HighRisk,
    },
    risk: {
      cin1: riskResult.cin1,
      cin2: riskResult.cin2,
      cin3: riskResult.cin3,
      ais: riskResult.ais,
      invasion: riskResult.invasion,
      cin2plus: riskResult.cin2plus,
      cin3plus: riskResult.cin3plus,
    },
    hpv,
    colposcopy: {
      conclusion: buildColposcopyConclusion(input, grade2, invasionSignsPresent),
      riskCategory: colposcopyRiskCategory,
    },
    combinedRiskBand: combinedBand,
    tz3Alert: buildTz3Alert(input),
    glandularAlert: buildGlandularAlert(input),
    quality: computeQuality(input),
  };
}
