import type { ElastographyCutoffs } from "../config/defaultCutoffs";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "../config/defaultCutoffs";
import type { BreastInput, ElastographyCalculatorResult, RiskCategory } from "../types";
import { validateBreastInput } from "./validateInput";

/** Молочная железа — Tsukuba + strain ratio + Emax (SWE) */
export function calculateBreast(
  input: BreastInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  validateBreastInput(input);
  const { BREAST_ELASTO, RISK_COLORS } = cutoffs;
  const { tsukubaScore, strainRatio, emaxKpa, lesionSizeMm, lesionDepthMm, method } = input;

  let category: RiskCategory = "intermediate";
  let biradsHint = "BI-RADS US — уточнить по полной шкале";

  const tsukuba = tsukubaScore ?? 0;
  const sr = strainRatio;
  const emax = emaxKpa;

  const tsukubaBenign =
    tsukuba >= BREAST_ELASTO.tsukuba.benign[0] && tsukuba <= BREAST_ELASTO.tsukuba.benign[1];
  const tsukubaInter = tsukuba === BREAST_ELASTO.tsukuba.intermediate;
  const tsukubaSusp = tsukuba >= BREAST_ELASTO.tsukuba.malignant[0];

  const srBenign = sr == null || sr < BREAST_ELASTO.strain.benign;
  const srInter = sr != null && sr >= BREAST_ELASTO.strain.benign && sr <= BREAST_ELASTO.strain.malignant;
  const srHigh = sr != null && sr > BREAST_ELASTO.strain.malignant;

  const emaxBenign = emax == null || emax < BREAST_ELASTO.emax.benign;
  const emaxInter = emax != null && emax >= BREAST_ELASTO.emax.benign && emax <= BREAST_ELASTO.emax.malignant;
  const emaxHigh = emax != null && emax > BREAST_ELASTO.emax.malignant;

  if (tsukubaBenign && srBenign && emaxBenign) {
    category = "low";
    biradsHint = "BI-RADS 2–3 (вероятно доброкачественное)";
  } else if (tsukubaInter || srInter || emaxInter) {
    category = "intermediate";
    biradsHint = "BI-RADS 4a/b — промежуточная подозрительность";
  } else if (tsukubaSusp || srHigh || emaxHigh) {
    category = "high";
    biradsHint = "BI-RADS 4c/5 — высокая подозрительность";
  }

  let conclusion: string;
  if (category === "low") {
    conclusion = "Эластографический паттерн доброкачественного образования молочной железы.";
  } else if (category === "intermediate") {
    conclusion = "Промежуточная эластографическая картина; интеграция с BI-RADS US обязательна.";
  } else {
    conclusion = "Жёсткое образование по эластографии — высокая подозрительность.";
  }

  const metrics: string[] = [];
  if (tsukubaScore) metrics.push(`Tsukuba ${tsukubaScore}`);
  if (sr != null) metrics.push(`SR ${sr.toFixed(1)}`);
  if (emax != null) metrics.push(`Emax ${emax.toFixed(0)} кПa`);
  if (metrics.length) conclusion += ` (${metrics.join(", ")}).`;

  let recommendation: string;
  if (category === "low") {
    recommendation = "Наблюдение по BI-RADS; контроль через 6–12 мес. при стабильности.";
  } else if (category === "intermediate") {
    recommendation = "Биопсия/толстигольная по BI-RADS 4; корреляция с морфологией B-mode.";
  } else {
    recommendation = "Биопсия под контролем УЗИ; онкологическое дообследование по протоколу.";
  }

  if (lesionDepthMm != null && lesionDepthMm > 20) {
    recommendation += " Глубокое расположение — учитывать ограничения SWE/strain.";
  }
  if (lesionSizeMm != null && lesionSizeMm < 5) {
    recommendation += " Малый размер — повторить измерение при лучшей визуализации.";
  }

  return {
    value: emax ?? sr ?? tsukuba,
    riskCategory: category,
    colorHex: RISK_COLORS[category],
    conclusion,
    recommendation,
    details: { tsukubaScore, strainRatio, emaxKpa, lesionSizeMm, lesionDepthMm, method },
    integrationHints: { biradsHint },
  };
}
