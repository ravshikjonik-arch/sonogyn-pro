import type {
  BiopsyUrgency,
  IfcpcAssessmentFlag,
  IfcpcColposcopyExam,
  IfcpcExamAssessment,
  IfcpcOverallImpression,
  IfcpcSignDefinition,
} from "../types";
import { getIfcpcSignById } from "../knowledge/nomenclature";

const URGENCY_RANK: Record<BiopsyUrgency, number> = {
  not_indicated: 0,
  consider: 1,
  recommended: 2,
  mandatory: 3,
  urgent: 4,
};

function maxUrgency(a: BiopsyUrgency, b: BiopsyUrgency): BiopsyUrgency {
  return URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;
}

function resolveSigns(ids: string[]): IfcpcSignDefinition[] {
  return ids.map((id) => getIfcpcSignById(id)).filter((s): s is IfcpcSignDefinition => Boolean(s));
}

/** Derives clinical summary, biopsy urgency, and flags from structured exam input. */
export function assessIfcpcExam(exam: Omit<IfcpcColposcopyExam, "assessment">): IfcpcExamAssessment {
  const flags: IfcpcAssessmentFlag[] = [];
  const adequacy = getIfcpcSignById(exam.adequacyId);
  const scj = getIfcpcSignById(exam.scjVisibilityId);
  const tz = getIfcpcSignById(exam.transformationZoneTypeId);
  const findings = resolveSigns(exam.findingSignIds);

  let highestColposcopicGrade: 0 | 1 | 2 = 0;
  let biopsyUrgency: BiopsyUrgency = "not_indicated";
  let overallImpression: IfcpcOverallImpression = "normal";

  if (exam.adequacyId === "adequacy_unsatisfactory") {
    flags.push("inadequate_exam");
    biopsyUrgency = maxUrgency(biopsyUrgency, "recommended");
    overallImpression = "inadequate_exam";
  }

  if (exam.scjVisibilityId === "scj_not_visible") {
    flags.push("scj_not_visible");
    biopsyUrgency = maxUrgency(biopsyUrgency, "recommended");
  }

  if (exam.transformationZoneTypeId === "tz3") {
    flags.push("tz3_limitation");
    biopsyUrgency = maxUrgency(biopsyUrgency, "recommended");
  }

  const grade1 = findings.filter((f) => f.colposcopicGrade === 1);
  const grade2 = findings.filter((f) => f.colposcopicGrade === 2);
  const invasion = findings.filter((f) => f.sectionId === "suspicious_invasion");
  const normalOnly =
    findings.length > 0 &&
    findings.every((f) => f.sectionId === "normal_findings") &&
    grade1.length === 0 &&
    grade2.length === 0 &&
    invasion.length === 0;

  if (grade1.length > 0) {
    flags.push("grade1_present");
    highestColposcopicGrade = 1;
    biopsyUrgency = maxUrgency(biopsyUrgency, "consider");
    overallImpression = "low_grade_changes";
  }

  if (grade2.length > 0) {
    flags.push("grade2_present");
    highestColposcopicGrade = 2;
    biopsyUrgency = maxUrgency(biopsyUrgency, "mandatory");
    overallImpression = "high_grade_suspicion";
  }

  if (invasion.length > 0) {
    flags.push("invasion_sign_present");
    highestColposcopicGrade = 2;
    biopsyUrgency = "urgent";
    overallImpression = "invasion_suspicion";
  }

  if (normalOnly) {
    flags.push("normal_only");
    if (overallImpression === "normal" && exam.adequacyId === "adequacy_satisfactory") {
      overallImpression = "benign_variants";
    }
  }

  if (findings.length === 0 && exam.adequacyId === "adequacy_satisfactory") {
    overallImpression = "normal";
  }

  for (const f of findings) {
    biopsyUrgency = maxUrgency(biopsyUrgency, f.biopsyUrgency);
  }

  const cinParts = [...new Set(findings.map((f) => f.cinRiskNarrative).filter(Boolean))];
  const hsilParts = [...new Set(findings.map((f) => f.hsilNarrative).filter(Boolean))];
  const invasionParts = [...new Set(findings.map((f) => f.invasionNarrative).filter(Boolean))];

  const biopsyRationale = buildBiopsyRationale({
    adequacy,
    scj,
    tz,
    grade1,
    grade2,
    invasion,
    biopsyUrgency,
  });

  const recommendationText = buildRecommendationText(biopsyUrgency, overallImpression, flags);

  return {
    overallImpression,
    highestColposcopicGrade,
    biopsyUrgency,
    biopsyRationale,
    cinRiskSummary: cinParts.length ? cinParts.join(" ") : "Явных аномальных признаков не отмечено.",
    hsilSummary: hsilParts.length ? hsilParts.join(" ") : "HSIL не выявлен по отмеченным признакам.",
    invasionSummary: invasionParts.length ? invasionParts.join(" ") : "Признаков инвазии не отмечено.",
    recommendationText,
    selectedSignCount: findings.length,
    flags,
  };
}

function buildBiopsyRationale(input: {
  adequacy?: IfcpcSignDefinition;
  scj?: IfcpcSignDefinition;
  tz?: IfcpcSignDefinition;
  grade1: IfcpcSignDefinition[];
  grade2: IfcpcSignDefinition[];
  invasion: IfcpcSignDefinition[];
  biopsyUrgency: BiopsyUrgency;
}): string {
  if (input.biopsyUrgency === "not_indicated") {
    return "При изолированных нормальных признаках и адекватном исследовании биопсия не требуется.";
  }
  if (input.invasion.length > 0) {
    return `Срочная биопсия: ${input.invasion.map((s) => s.titleRu).join(", ")}.`;
  }
  if (input.grade2.length > 0) {
    return `Major-признаки IFCPC (Grade 2): ${input.grade2.map((s) => s.titleRu).join(", ")} — прицельная биопсия обязательна.`;
  }
  if (input.grade1.length > 0) {
    return `Minor-признаки (Grade 1): ${input.grade1.map((s) => s.titleRu).join(", ")} — биопсия по клиническому контексту и скринингу.`;
  }
  if (input.adequacy?.id === "adequacy_unsatisfactory" || input.tz?.id === "tz3" || input.scj?.id === "scj_not_visible") {
    return "Ограниченная визуализация SCJ/TZ — верификация канала и повторная кольпоскопия по показаниям.";
  }
  return "Биопсия по индивидуальным показаниям.";
}

function buildRecommendationText(
  urgency: BiopsyUrgency,
  impression: IfcpcOverallImpression,
  flags: IfcpcAssessmentFlag[],
): string {
  if (impression === "invasion_suspicion") {
    return "Срочная прицельная биопсия; гистологическая верификация; рассмотреть консультацию онкогинеколога. Не откладывать при подозрении на инвазию.";
  }
  if (urgency === "mandatory") {
    return "Выполнить прицельную биопсию под контролем кольпоскопии; тактика по результату гистологии (CIN 2+ → лечение по локальным протоколам).";
  }
  if (urgency === "recommended") {
    return "Рекомендована биопсия и/или эндоцервикальный sampling; повторная кольпоскопия при неадекватном исследовании или TZ3.";
  }
  if (urgency === "consider") {
    return "Рассмотреть биопсию с учётом цитологии, HPV и динамики; при HSIL+ — биопсия показана.";
  }
  if (flags.includes("normal_only")) {
    return "Наблюдение по программе скрининга; контроль по показаниям.";
  }
  return "Продолжить скрининговую программу; биопсия не требуется при отсутствии аномальных признаков.";
}

/** Returns exam with computed assessment block. */
export function finalizeIfcpcExam(
  exam: Omit<IfcpcColposcopyExam, "assessment">,
): IfcpcColposcopyExam {
  return {
    ...exam,
    assessment: assessIfcpcExam(exam),
  };
}
