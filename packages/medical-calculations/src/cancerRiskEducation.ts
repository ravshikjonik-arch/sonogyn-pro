/**
 * Образовательные чеклисты риска РМЖ, РШМ, рака яичников.
 * Не заменяют модели Gail, BRCAPRO, RMI, IOTA ADNEX.
 */

export type BreastRiskInput = {
  age: number;
  menarcheBefore12: boolean;
  firstBirthAfter30OrNulliparous: boolean;
  firstDegreeBcOrOvary: boolean;
  priorBreastBiopsyBenign: boolean;
};

export function evaluateBreastRiskEducation(input: BreastRiskInput): {
  band: "ниже среднего" | "средний" | "повышенный";
  score: number;
  text: string[];
} {
  let score = 0;
  if (input.age >= 50) score += 1;
  if (input.age >= 60) score += 1;
  if (input.menarcheBefore12) score += 1;
  if (input.firstBirthAfter30OrNulliparous) score += 1;
  if (input.firstDegreeBcOrOvary) score += 2;
  if (input.priorBreastBiopsyBenign) score += 1;

  let band: "ниже среднего" | "средний" | "повышенный";
  if (score >= 4) band = "повышенный";
  else if (score >= 2) band = "средний";
  else band = "ниже среднего";

  const text = [
    `Баллы упрощённого чеклиста: ${score}.`,
    `Ориентировочная группа внимания: «${band}».`,
    "Пожизненный риск индивидуален (Gail/Tyrer-Cuzick, NCI, BRCA). Скрининг — по КР МЗ РФ и маршруту маммолога/генетика.",
  ];
  return { band, score, text };
}

export type CervicalRiskInput = {
  age: number;
  hpv16or18Positive: boolean;
  hsilOrAtypicalGlandular: boolean;
  smoking: boolean;
  immunosuppression: boolean;
  /** ≥3 лет с последнего скрининга при age ≥30 */
  overdueScreening: boolean;
};

export function evaluateCervicalCancerRisk(input: CervicalRiskInput): {
  level: "низкий" | "умеренный" | "высокий";
  text: string[];
} {
  let score = 0;
  if (input.age >= 30) score += 1;
  if (input.hpv16or18Positive) score += 3;
  if (input.hsilOrAtypicalGlandular) score += 3;
  if (input.smoking) score += 1;
  if (input.immunosuppression) score += 2;
  if (input.overdueScreening) score += 1;

  let level: "низкий" | "умеренный" | "высокий";
  if (score >= 5) level = "высокий";
  else if (score >= 2) level = "умеренный";
  else level = "низкий";

  const text = [
    `Ориентир стратификации: ${level} (баллы ${score}).`,
    input.hpv16or18Positive || input.hsilOrAtypicalGlandular
      ? "→ Кольпоскопия + биопсия по ASCCP/КР РФ."
      : "→ Продолжить скрининг ВПЧ/цитология по воз возрасту.",
    "Не заменяет histology и colposcopy-directed biopsy.",
  ];
  return { level, text };
}

export type OvarianRiskInput = {
  age: number;
  firstDegreeOvaryBreast: boolean;
  brcaKnown: boolean;
  postmenopausal: boolean;
  /** CA-125 >35 U/mL */
  ca125Elevated: boolean;
  /** УЗ- признаки: солидные компоненты, papillations, ascites */
  suspiciousUltrasound: boolean;
};

export function evaluateOvarianCancerRisk(input: OvarianRiskInput): {
  level: "низкий" | "промежуточный" | "высокий";
  text: string[];
  suggestOrads: boolean;
} {
  let score = 0;
  if (input.age >= 50) score += 1;
  if (input.age >= 60) score += 1;
  if (input.firstDegreeOvaryBreast) score += 2;
  if (input.brcaKnown) score += 3;
  if (input.postmenopausal) score += 1;
  if (input.ca125Elevated) score += 2;
  if (input.suspiciousUltrasound) score += 3;

  let level: "низкий" | "промежуточный" | "высокий";
  if (score >= 6) level = "высокий";
  else if (score >= 3) level = "промежуточный";
  else level = "низкий";

  const suggestOrads = input.suspiciousUltrasound || level === "высокий";
  const text = [
    `Эпидемиологический/клинический ориентир: ${level}.`,
    suggestOrads
      ? "→ O-RADS US / IOTA ADNEX для образования; онкогинеколог при подозрении на злокачественность."
      : "→ Наблюдение/simple cyst protocol по IOTA при типичной кисте.",
    "RMI/IOTA ADNEX точнее чеклиста — используйте при наличии данных УЗИ.",
  ];
  return { level, text, suggestOrads };
}

export const CANCER_RISK_DISCLAIMER =
  "Образовательная стратификация. Не диагноз. Решения — по гайдлайнам и очному осмотру.";
