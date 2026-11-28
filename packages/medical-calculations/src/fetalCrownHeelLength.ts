/**
 * Оценочная длина плода (crown-heel) по длине бедренной кости.
 * Учебная линейная аппроксимация для автоподстановки в протокол; прямое измерение — приоритет.
 */
export function estimateCrownHeelLengthCmFromFl(flMm: number | undefined): number | null {
  if (flMm == null || !Number.isFinite(flMm) || flMm < 15 || flMm > 85) return null;
  const chlCm = flMm * 0.73 + 1.6;
  if (chlCm < 8 || chlCm > 55) return null;
  return Math.round(chlCm * 10) / 10;
}