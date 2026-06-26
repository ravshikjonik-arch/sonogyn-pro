import type { AchievementCatalogItem } from "./types";

/**
 * Каталог бейджей — единый источник правды.
 * Чтобы добавить новый бейдж: допишите объект сюда + (опционально) строку в SQL-миграции.
 */
export const ACHIEVEMENT_CATALOG: AchievementCatalogItem[] = [
  {
    slug: "orads-explorer",
    name: "O-RADS Explorer",
    description: "Пройдено 3 учебных кейса по O-RADS US",
    iconEmoji: "⭐",
    xpReward: 50,
    criteriaType: "CASES_COMPLETED",
    criteriaValue: 3,
    moduleId: "orads",
  },
  {
    slug: "iota-pro",
    name: "IOTA Pro",
    description: "5 правильных интерпретаций IOTA подряд",
    iconEmoji: "⭐⭐",
    xpReward: 75,
    criteriaType: "CORRECT_STREAK",
    criteriaValue: 5,
    moduleId: "iota",
  },
  {
    slug: "ultrasound-student",
    name: "Ученик УЗИ",
    description: "Изучено 10 учебных материалов",
    iconEmoji: "⭐",
    xpReward: 50,
    criteriaType: "LESSONS_COMPLETED",
    criteriaValue: 10,
    moduleId: "general",
  },
  {
    slug: "patient-streak",
    name: "Терпеливый",
    description: "7 дней подряд заходите в платформу",
    iconEmoji: "🔥",
    xpReward: 100,
    criteriaType: "LOGIN_STREAK",
    criteriaValue: 7,
    moduleId: null,
  },
  {
    slug: "fmf-master",
    name: "FMF Мастер",
    description: "100% прохождение раздела FMF",
    iconEmoji: "🏆",
    xpReward: 150,
    criteriaType: "MODULE_COMPLETION",
    criteriaValue: 100,
    moduleId: "fmf",
  },
];

export function catalogItemBySlug(slug: string): AchievementCatalogItem | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.slug === slug);
}
