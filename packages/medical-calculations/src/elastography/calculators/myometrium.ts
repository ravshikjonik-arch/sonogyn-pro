import type { ElastographyCutoffs } from "../config/defaultCutoffs";
import { DEFAULT_ELASTOGRAPHY_CUTOFFS } from "../config/defaultCutoffs";
import type { ElastographyCalculatorResult, MyometriumInput, RiskCategory } from "../types";
import { validateMyometriumInput } from "./validateInput";

/** Миометрий — SWE ratio = E образования / E референсного миометрия */
export function calculateMyometrium(
  input: MyometriumInput,
  cutoffs: ElastographyCutoffs = DEFAULT_ELASTOGRAPHY_CUTOFFS,
): ElastographyCalculatorResult {
  validateMyometriumInput(input);
  const { MYOMETRIUM_SWE, RISK_COLORS } = cutoffs;
  const { lesionYoungModulusKpa: eLesion, referenceMyometriumKpa: eRef, lesionType } = input;
  const ratio = eRef > 0 ? eLesion / eRef : 0;

  let category: RiskCategory = "intermediate";
  let conclusion = "";
  let recommendation = "";

  const fibroidPattern = eLesion >= MYOMETRIUM_SWE.fibroid.min && ratio >= MYOMETRIUM_SWE.ratioCutoff;
  const adenoPattern =
    eLesion >= MYOMETRIUM_SWE.adenomyosis.min &&
    eLesion <= MYOMETRIUM_SWE.adenomyosis.max &&
    ratio >= MYOMETRIUM_SWE.adenomyosis.ratioMin &&
    ratio <= MYOMETRIUM_SWE.adenomyosis.ratioMax;

  if (lesionType === "fibroid" || (lesionType === "unclear" && fibroidPattern)) {
    category = fibroidPattern ? "intermediate" : "low";
    conclusion = `Образование миометрия: E=${eLesion.toFixed(1)} кПа, SWE ratio=${ratio.toFixed(2)}. Паттерн совместим с жёстким узловым образованием (миома).`;
    recommendation = "Корреляция с B-mode/дoppler, FIGO-локализация; тактика — наблюдение или хирургия по клинике.";
  } else if (lesionType === "adenomyosis" || (lesionType === "unclear" && adenoPattern)) {
    category = "intermediate";
    conclusion = `E=${eLesion.toFixed(1)} кПa, ratio=${ratio.toFixed(2)}. Паттерн может соответствовать участку аденомиоза (умеренная жёсткость).`;
    recommendation = "Сопоставить с эхоструктурой, «myometrial cysts», контакт с эндометрием; МРТ по показаниям.";
  } else if (fibroidPattern) {
    category = "intermediate";
    conclusion = `SWE ratio ${ratio.toFixed(2)}, E=${eLesion.toFixed(1)} кПа — склонность к миоме.`;
    recommendation = "Уточнить тип образования на B-mode; дифференцировать с аденомиозом.";
  } else if (adenoPattern) {
    category = "intermediate";
    conclusion = `Умеренная жёсткость (E ${eLesion.toFixed(1)} кПa) — возможный аденомиоз.`;
    recommendation = "Клинико-анамnestic correlation; консенсусные признаки аденомиоза на УЗИ.";
  } else {
    category = "low";
    conclusion = `E=${eLesion.toFixed(1)} кПa, ratio=${ratio.toFixed(2)}. Однозначный паттерн миомы/аденомиоза не выражен.`;
    recommendation = "Интегрировать с морфологией и симптоматикой; повтор SWE при сомнениях.";
  }

  return {
    value: ratio,
    riskCategory: category,
    colorHex: RISK_COLORS[category],
    conclusion,
    recommendation,
    details: { eLesion, eRef, ratio, lesionType, fibroidPattern, adenoPattern },
  };
}
