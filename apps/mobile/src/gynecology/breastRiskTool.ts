/**
 * Очень упрощённая шкала «направление риска» для обсуждения с пациенткой (не модель Гейла, не клинический диагноз).
 */
export const BREAST_RISK_TOOL_VERSION = "Ориентир риска МЖ v1 (образовательный чеклист, не диагноз)";

export type BreastRiskInput = {
  age: number;
  menarcheBefore12: boolean;
  firstBirthAfter30OrNulliparous: boolean;
  firstDegreeBcOrOvary: boolean;
  priorBreastBiopsyBenign: boolean;
};

export function evaluateBreastRiskEducation(input: BreastRiskInput): {
  band: "ниже среднего" | "средний" | "повышенный";
  text: string[];
} {
  let score = 0;
  const lines: string[] = [];
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

  lines.push(
    `Баллы упрощённого чеклиста: ${score} (возраст, менархе, первородность, наследственность, биопсия).`
  );
  lines.push(`Ориентировочная группа внимания: «${band}».`);
  lines.push(
    "Пожизненный риск рака молочной железы индивидуален (модель Гейла/Тайрер-Кьюзик, NCI, BRCA и др.). Используйте протокол скрининга МЗ РФ и направляйте на консультацию маммолога/генетика при показаниях."
  );
  return { band, text: lines };
}
