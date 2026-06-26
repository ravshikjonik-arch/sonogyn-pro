/** Каждые 100 XP = +1 уровень (уровень 1 при 0–99 XP). */
export const XP_PER_LEVEL = 100;

export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1;
}

export function xpProgressInLevel(totalXp: number): {
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
} {
  const xpInCurrentLevel = totalXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;
  const xpProgressPercent = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
  return { xpInCurrentLevel, xpToNextLevel, xpProgressPercent };
}

/** XP за действие в модуле — для виджета «Прогресс по разделу» */
export const MODULE_ACTION_XP: Record<string, number> = {
  case_complete: 25,
  lesson_complete: 15,
  quiz_pass: 20,
  interpretation: 10,
};

export function xpForEvent(eventType: string): number {
  return MODULE_ACTION_XP[eventType] ?? 10;
}
