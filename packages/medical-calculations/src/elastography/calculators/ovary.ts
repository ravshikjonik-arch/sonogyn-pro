import type { ElastographyCutoffs } from "../config/defaultCutoffs";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "../config/defaultCutoffs";
import type { ElastographyCalculatorResult, OvaryInput, RiskCategory } from "../types";
import { validateOvaryInput } from "./validateInput";

function worstCategory(a: RiskCategory, b: RiskCategory): RiskCategory {
  const rank = { low: 0, intermediate: 1, high: 2 } as const;
  return rank[a] >= rank[b] ? a : b;
}

/** Яичники — комбинированная strain + SWE оценка */
export function calculateOvary(
  input: OvaryInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  validateOvaryInput(input);
  const { OVARY_ELASTO, RISK_COLORS } = cutoffs;
  const { strainRatio, youngModulusKpa, iotaType, method } = input;

  let strainCat: RiskCategory = "intermediate";
  let sweCat: RiskCategory = "intermediate";

  if (strainRatio != null) {
    if (strainRatio < OVARY_ELASTO.strain.benign) strainCat = "low";
    else if (strainRatio <= OVARY_ELASTO.strain.malignant) strainCat = "intermediate";
    else strainCat = "high";
  }

  if (youngModulusKpa != null) {
    if (youngModulusKpa < OVARY_ELASTO.swe.benign) sweCat = "low";
    else if (youngModulusKpa <= OVARY_ELASTO.swe.malignant) sweCat = "intermediate";
    else sweCat = "high";
  }

  let category: RiskCategory =
    method === "both" && strainRatio != null && youngModulusKpa != null
      ? worstCategory(strainCat, sweCat)
      : method === "shear_wave" && youngModulusKpa != null
        ? sweCat
        : strainRatio != null
          ? strainCat
          : "intermediate";

  if (iotaType === "cyst" && category === "high" && (strainRatio ?? 99) < 4) {
    category = "intermediate";
  }

  let conclusion: string;
  if (category === "low") {
    conclusion = "Эластографические признаки доброкачественного образования яичника.";
  } else if (category === "intermediate") {
    conclusion = "Промежуточная эластографическая картина; требуется IOTA/O-RADS корреляция.";
  } else {
    conclusion = "Повышенная жёсткость — подозрение на малигнизацию/агрессивный паттерн.";
  }

  const parts: string[] = [];
  if (strainRatio != null) parts.push(`Strain ratio ${strainRatio.toFixed(1)}`);
  if (youngModulusKpa != null) parts.push(`E ${youngModulusKpa.toFixed(1)} кПa`);
  if (parts.length) conclusion += ` (${parts.join("; ")}).`;

  let recommendation: string;
  if (category === "low") {
    recommendation = "Доброкачественный паттерн — ведение по O-RADS/IOTA; динамика по протоколу.";
  } else if (category === "intermediate") {
    recommendation = "Рассчитать RMI при необходимости; IOTA ADNEX / консультация онкогинеколога по показаниям.";
  } else {
    recommendation = "O-RADS ≥4, IOTA ADNEX, онкогинеколог; CA-125/HE4 по клинике.";
  }

  return {
    value: strainRatio ?? youngModulusKpa ?? 0,
    riskCategory: category,
    colorHex: RISK_COLORS[category],
    conclusion,
    recommendation,
    details: { strainRatio, youngModulusKpa, iotaType, method, strainCat, sweCat },
    integrationHints: {
      oradsHint: category === "high" ? "O-RADS 4–5" : category === "intermediate" ? "O-RADS 3" : "O-RADS 2",
      rmiHint: category !== "low" ? "Consider RMI if postmenopausal complex mass" : undefined,
    },
  };
}
