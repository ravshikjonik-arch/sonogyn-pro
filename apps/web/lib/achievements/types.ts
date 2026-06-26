/** Типы событий для POST /api/achievements/check */
export type AchievementEventType =
  | "case_complete"
  | "lesson_complete"
  | "quiz_pass"
  | "interpretation"
  | "daily_login"
  | "module_progress";

export type ClinicalModuleId = "orads" | "iota" | "birads" | "tirads" | "fmf" | "general";

/** Критерии бейджа — добавляйте новый тип здесь и в evaluateAchievementCriteria */
export type AchievementCriteriaType =
  | "CASES_COMPLETED"
  | "CORRECT_STREAK"
  | "LESSONS_COMPLETED"
  | "LOGIN_STREAK"
  | "MODULE_COMPLETION";

export type ProgressStats = {
  casesByModule: Partial<Record<ClinicalModuleId, number>>;
  lessonsCompleted: number;
  fmfCompleted: number;
  fmfTotal: number;
};

export type AchievementCatalogItem = {
  slug: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
  criteriaType: AchievementCriteriaType;
  criteriaValue: number;
  moduleId: ClinicalModuleId | null;
};

export type UnlockedAchievement = {
  slug: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
  unlockedAt: string;
};

export type AchievementWithStatus = AchievementCatalogItem & {
  unlocked: boolean;
  unlockedAt: string | null;
};

export type UserAchievementsPayload = {
  progress: {
    totalXp: number;
    level: number;
    streakDays: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    xpProgressPercent: number;
  };
  achievements: AchievementWithStatus[];
  stats: ProgressStats;
};

export type CheckAchievementsResult = {
  newlyUnlocked: UnlockedAchievement[];
  progress: UserAchievementsPayload["progress"];
  stats: ProgressStats;
};
