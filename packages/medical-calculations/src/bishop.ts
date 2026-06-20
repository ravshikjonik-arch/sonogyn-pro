/**
 * Bishop score — cervical ripeness before induction (modified Bishop, 0–13).
 * Reference: Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol. 1964.
 */

export type BishopDilation = 0 | 1 | 2 | 3;
export type BishopEffacement = 0 | 1 | 2 | 3;
export type BishopStation = 0 | 1 | 2 | 3;
export type BishopConsistency = 0 | 1 | 2;
export type BishopPosition = 0 | 1 | 2;

export type BishopInput = {
  dilation: BishopDilation;
  effacement: BishopEffacement;
  station: BishopStation;
  consistency: BishopConsistency;
  position: BishopPosition;
};

export type BishopResult = {
  total: number;
  favorable: boolean;
  interpretation: string;
  hints: string[];
};

const DILATION_LABELS = ["0 см", "1–2 см", "3–4 см", "≥5 см"] as const;
const EFFACEMENT_LABELS = ["0–30%", "40–50%", "60–70%", "≥80%"] as const;
const STATION_LABELS = ["−3", "−2", "−1/0", "+1/+2"] as const;
const CONSISTENCY_LABELS = ["Плотная", "Средняя", "Мягкая"] as const;
const POSITION_LABELS = ["Задняя", "Средняя", "Передняя"] as const;

export function bishopScore(input: BishopInput): BishopResult {
  const total =
    input.dilation + input.effacement + input.station + input.consistency + input.position;
  const favorable = total >= 6;
  const hints: string[] = [
    `Раскрытие: ${DILATION_LABELS[input.dilation]} (+${input.dilation})`,
    `Сглаженность: ${EFFACEMENT_LABELS[input.effacement]} (+${input.effacement})`,
    `Сведение головки: ${STATION_LABELS[input.station]} (+${input.station})`,
    `Консистенция: ${CONSISTENCY_LABELS[input.consistency]} (+${input.consistency})`,
    `Положение шейки: ${POSITION_LABELS[input.position]} (+${input.position})`,
  ];

  let interpretation: string;
  if (total >= 8) {
    interpretation = "Высокая вероятность успешной индукции / родов в ближайшие 24 ч при начале стимуляции.";
  } else if (total >= 6) {
    interpretation = "Благоприятная шейка (≥6) — индукция оksitocin/АМК чаще успешна; ripening по протоколу при необходимости.";
  } else if (total >= 4) {
    interpretation = "Промежуточная шейка — рассмотрите созревание (простaglandins, баллон Foley) перед окситоцином.";
  } else {
    interpretation = "Неблагоприятная шейка (<6) — высокий риск неудачной индукции; созревание и повторная оценка Bishop.";
  }

  return { total, favorable, interpretation, hints };
}

export const BISHOP_DISCLAIMER =
  "Bishop score — ориентир перед индукцией. Не заменяет клинический протокол, CTG и решение акушера.";
