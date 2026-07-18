import { calculateAdenomyosisScore } from "../scoring/adenomyosis-score";
import {
  classifyJzThickness,
  getDirectFeatures,
  getIndirectFeatures,
  localizationLabel,
  MUSA_ADENOMYOSIS_KNOWLEDGE,
  type MusaAdenomyosisAssessmentInput,
  type MusaAdenomyosisReport,
} from "../types";

export function generateAdenomyosisReport(input: MusaAdenomyosisAssessmentInput): MusaAdenomyosisReport {
  const score = calculateAdenomyosisScore(input);
  const jzClass = classifyJzThickness(input.jzThicknessMm ?? null);
  const jzBand = MUSA_ADENOMYOSIS_KNOWLEDGE.junctionalZone.classification.find((c) => c.class === jzClass);

  const featureBullets: string[] = [];
  for (const card of getDirectFeatures()) {
    const active =
      (card.id === "myometrial-cysts" && input.myometrialCysts) ||
      (card.id === "hyperechogenic-islands" && input.hyperechogenicIslands) ||
      (card.id === "subendometrial-striations" && input.subendometrialStriations);
    if (active) featureBullets.push(card.reporting_phrase);
  }
  for (const card of getIndirectFeatures()) {
    const active =
      (card.id === "heterogeneous-myometrium" && input.heterogeneousMyometrium) ||
      (card.id === "fan-shaped-shadowing" && input.fanShapedShadowing) ||
      (card.id === "asymmetric-thickening" && input.asymmetry) ||
      (card.id === "globular-uterus" && input.globularUterus);
    if (active) featureBullets.push(card.reporting_phrase);
  }

  if (input.jzThicknessMm != null && Number.isFinite(input.jzThicknessMm)) {
    featureBullets.push(jzBand?.reportingText ?? `Толщина JZ ${input.jzThicknessMm} мм (${jzClass}).`);
  }

  const morph = input.morphologicType
    ? MUSA_ADENOMYOSIS_KNOWLEDGE.adenomyosisTypes.find((t) => t.code === input.morphologicType)
    : undefined;

  const depth = input.depthOfInvasion
    ? MUSA_ADENOMYOSIS_KNOWLEDGE.depthOfInvasion.find((d) => d.code === input.depthOfInvasion)
    : undefined;

  const locText =
    input.localization && input.localization.length > 0
      ? input.localization.map((c) => localizationLabel(c)).join(", ")
      : "не указана";

  const onlyVagueHeterogeneity =
    input.heterogeneousMyometrium &&
    !input.myometrialCysts &&
    !input.hyperechogenicIslands &&
    !input.subendometrialStriations &&
    !input.asymmetry &&
    !input.globularUterus &&
    !input.fanShapedShadowing &&
    (input.jzThicknessMm == null || input.jzThicknessMm < 8) &&
    !input.jzIrregularity;

  const structuredLines = [
    "МАТКА — MUSA Adenomyosis (Sonogyn-Pro, образовательный шаблон)",
    "",
    "Миометрий:",
    featureBullets.length ? featureBullets.map((b) => `• ${b}`).join("\n") : "• Специфические признаки по отмеченным пунктам не описаны.",
    "",
    `Junctional zone: ${jzClass}${input.jzThicknessMm != null ? ` (${input.jzThicknessMm} мм)` : ""}.`,
    input.jzIrregularity ? `Неровность JZ: ${input.jzIrregularity}.` : null,
    "",
    `Локализация (Sonogyn Map): ${locText}.`,
    depth ? `Глубина инвазии: ${depth.reportingText}` : null,
    morph ? `Морфологический тип: ${morph.reportingTemplate}` : null,
    input.uterineContour ? `Контур матки: ${input.uterineContour}.` : null,
    input.anteriorWallMm != null && input.posteriorWallMm != null
      ? `Толщина стенок: передняя ${input.anteriorWallMm} мм, задняя ${input.posteriorWallMm} мм.`
      : null,
    "",
    onlyVagueHeterogeneity
      ? "⚠ MUSA: формулировка «неоднородный миометрий» недостаточна — добавьте конкретные признаки, локализацию, JZ и тип."
      : null,
    `Sonogyn Adenomyosis Score: ${score.total}/${score.maxScore} — ${score.labelRu}.`,
    "",
    `Версия модуля: ${MUSA_ADENOMYOSIS_KNOWLEDGE.module} ${MUSA_ADENOMYOSIS_KNOWLEDGE.version}`,
  ].filter(Boolean) as string[];

  const suggestedDiagnosis =
    score.category === "low"
      ? "УЗ-признаки аденомиоза по MUSA не выражены."
      : score.category === "possible"
        ? "Возможен аденомиоз — рекомендуется корреляция с клиникой и при необходимости МРТ."
        : score.category === "probable"
          ? "Вероятен аденомиоз по совокупности MUSA-признаков."
          : "УЗ-признаки высоко соответствуют аденомиозу (MUSA / Sonogyn Score).";

  const clinicalImpression = `${suggestedDiagnosis} ${MUSA_ADENOMYOSIS_KNOWLEDGE.disclaimer.ru}`;

  return {
    structuredReport: structuredLines.join("\n"),
    clinicalImpression,
    sonogynScore: score.total,
    maxScore: score.maxScore,
    probabilityCategory: score.category,
    probabilityLabelRu: score.labelRu,
    suggestedDiagnosis,
    badgeColor: score.badgeColor,
    featureBullets,
    disclaimer: MUSA_ADENOMYOSIS_KNOWLEDGE.disclaimer.ru,
  };
}
