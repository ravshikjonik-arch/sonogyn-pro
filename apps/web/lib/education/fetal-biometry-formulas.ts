/** ISUOG fetal biometry formula transparency (aligned with isuog.org calculators). */

export type BiometryFormula = {
  parameter: string;
  purpose: string;
  formula: string;
  reference: string;
  rangeWeeks: string;
  disclaimer?: string;
};

export const FETAL_BIOMETRY_FORMULAS: BiometryFormula[] = [
  {
    parameter: "CRL",
    purpose: "Dating pregnancy",
    formula: "Papageorghiou et al., UOG 2014",
    reference: "Papageorghiou AT et al. Ultrasound Obstet Gynecol 2014",
    rangeWeeks: "9–13 нед (postmenstrual)",
  },
  {
    parameter: "BPD, HC, AC, FL",
    purpose: "Biometry II–III trimester",
    formula: "Papageorghiou et al., Lancet 2014 (INTERGROWTH-21st related)",
    reference: "Papageorghiou AT et al. Lancet 2014",
    rangeWeeks: "14–42 нед",
  },
  {
    parameter: "EFW",
    purpose: "Estimated fetal weight",
    formula: "Hadlock et al. (комбинации HC, AC, FL, BPD)",
    reference: "Hadlock FP et al. AJOG 1985",
    rangeWeeks: "по протоколу клиники",
  },
  {
    parameter: "EFW percentile",
    purpose: "Growth centile",
    formula: "Derived from Yudkin et al., Early Human Development 1987",
    reference: "Yudkin PL et al. Early Hum Dev 1987",
    rangeWeeks: "24–42 нед",
  },
  {
    parameter: "BPD dating",
    purpose: "Alternative dating",
    formula: "Selbing et al., Acta Obstet Gynecol Scand 1985",
    reference: "Selbing A et al. 1985",
    rangeWeeks: "11–24 нед",
  },
];

export const BIOMETRY_DISCLAIMER =
  "Калькуляторы — справочные примеры (ISUOG). Перед клиническими решениями верифицируйте нормы на локальной популяции. SonoGyn Pro использует формулы Hadlock/Медведев и др. — см. конкретный калькулятор.";
