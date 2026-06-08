import type { ElastographyCutoffs } from "../config/defaultCutoffs";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "../config/defaultCutoffs";
import type { CervixInput, ElastographyCalculatorResult, RiskCategory } from "../types";
import { validateCervixInput } from "./validateInput";

function riskMeta(
  category: RiskCategory,
  cutoffs: ElastographyCutoffs,
): Pick<ElastographyCalculatorResult, "riskCategory" | "colorHex"> {
  return { riskCategory: category, colorHex: cutoffs.RISK_COLORS[category] };
}

/** Шейка матки — strain, CCI = внутренний / наружный индекс жёсткости */
export function calculateCervix(
  input: CervixInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  validateCervixInput(input);

  const { CERVIX_CCI } = cutoffs;
  const { internalOsStiffness: inner, externalOsStiffness: outer, gestationalWeeks } = input;
  const cci = outer > 0 ? inner / outer : 0;

  let category: RiskCategory;
  let conclusion: string;
  let recommendation: string;

  if (cci < CERVIX_CCI.soft.max) {
    category = "high";
    conclusion = `Мягкая шейка матки (CCI ${cci.toFixed(2)}). Повышенный риск преждевременных родов по данным strain-эластографии.`;
    recommendation =
      "Клиническая корреляция, оценка длины шейки, при необходимости — тактика perinatology/tocolysis по протоколу центра.";
  } else if (cci <= CERVIX_CCI.intermediate.max) {
    category = "intermediate";
    conclusion = `Промежуточная консистенция шейки (CCI ${cci.toFixed(2)}).`;
    recommendation = "Динамическое наблюдение, повторная эластография и трансвагинальное УЗИ по показаниям.";
  } else {
    category = "low";
    conclusion = `Плотная шейка матки (CCI ${cci.toFixed(2)}). Низкий риск преждевременных родов по эластографическим критериям.`;
    recommendation = "Ведение по общему акушерскому протоколу; контроль по клиническим показаниям.";
  }

  if (gestationalWeeks != null && gestationalWeeks < 24 && category === "high") {
    recommendation += " При сроке <24 нед — усиленный мониторинг согласно локальному протоколу ПР.";
  }

  return {
    value: cci,
    ...riskMeta(category, cutoffs),
    conclusion,
    recommendation,
    details: { inner, outer, cci, gestationalWeeks },
  };
}
