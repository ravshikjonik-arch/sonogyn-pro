import { prisma } from "@/lib/prisma";

import { ACHIEVEMENT_CATALOG } from "./catalog";
import { levelFromXp, xpForEvent, xpProgressInLevel } from "./level";
import type {
  AchievementCatalogItem,
  AchievementCriteriaType,
  AchievementEventType,
  AchievementWithStatus,
  CheckAchievementsResult,
  ClinicalModuleId,
  ProgressStats,
  UnlockedAchievement,
  UserAchievementsPayload,
} from "./types";

function newId(): string {
  return crypto.randomUUID();
}

export function isPrismaConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function emptyStats(): ProgressStats {
  return { casesByModule: {}, lessonsCompleted: 0, fmfCompleted: 0, fmfTotal: 0 };
}

function parseStats(raw: unknown): ProgressStats {
  if (!raw || typeof raw !== "object") return emptyStats();
  const s = raw as Partial<ProgressStats>;
  return {
    casesByModule: (s.casesByModule as ProgressStats["casesByModule"]) ?? {},
    lessonsCompleted: typeof s.lessonsCompleted === "number" ? s.lessonsCompleted : 0,
    fmfCompleted: typeof s.fmfCompleted === "number" ? s.fmfCompleted : 0,
    fmfTotal: typeof s.fmfTotal === "number" ? s.fmfTotal : 0,
  };
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/** Синхронизирует справочник Achievement в БД с ACHIEVEMENT_CATALOG */
export async function ensureAchievementCatalog(): Promise<void> {
  await Promise.all(
    ACHIEVEMENT_CATALOG.map((item) =>
      prisma.achievement.upsert({
        where: { slug: item.slug },
        create: {
          id: `ach_${item.slug.replace(/-/g, "_")}`,
          name: item.name,
          slug: item.slug,
          description: item.description,
          iconEmoji: item.iconEmoji,
          xpReward: item.xpReward,
          criteriaType: item.criteriaType,
          criteriaValue: item.criteriaValue,
          moduleId: item.moduleId,
        },
        update: {
          name: item.name,
          description: item.description,
          iconEmoji: item.iconEmoji,
          xpReward: item.xpReward,
          criteriaType: item.criteriaType,
          criteriaValue: item.criteriaValue,
          moduleId: item.moduleId,
        },
      }),
    ),
  );
}

async function getOrCreateProgress(userId: string) {
  const existing = await prisma.userProgress.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProgress.create({
    data: { id: newId(), userId, stats: emptyStats() },
  });
}

export type CheckEventInput = {
  eventType: AchievementEventType;
  moduleId: ClinicalModuleId;
  correct?: boolean;
  score?: number;
  passed?: boolean;
  fmfCompleted?: number;
  fmfTotal?: number;
};

/**
 * Обновляет прогресс по событию и проверяет критерии бейджей.
 * Новые критерии: добавьте ветку в applyEventToProgress + evaluateAchievementCriteria.
 */
export async function checkAndAwardAchievements(
  userId: string,
  event: CheckEventInput,
): Promise<CheckAchievementsResult> {
  await ensureAchievementCatalog();

  let progress = await getOrCreateProgress(userId);
  let stats = parseStats(progress.stats);
  let streakDays = progress.streakDays;
  let iotaCorrectStreak = progress.iotaCorrectStreak;
  let totalXp = progress.totalXp;
  let lastActiveDate = progress.lastActiveDate;

  const today = startOfUtcDay(new Date());

  // --- Обработка событий (расширяйте switch для новых триггеров) ---
  switch (event.eventType) {
    case "daily_login": {
      if (!lastActiveDate) {
        streakDays = 1;
      } else {
        const gap = daysBetween(lastActiveDate, today);
        if (gap === 0) {
          // тот же день — стрик не меняем
        } else if (gap === 1) {
          streakDays += 1;
        } else {
          streakDays = 1;
        }
      }
      lastActiveDate = today;
      totalXp += 5;
      break;
    }
    case "case_complete": {
      const mod = event.moduleId;
      stats.casesByModule[mod] = (stats.casesByModule[mod] ?? 0) + 1;
      totalXp += xpForEvent("case_complete");
      break;
    }
    case "lesson_complete": {
      stats.lessonsCompleted += 1;
      totalXp += xpForEvent("lesson_complete");
      break;
    }
    case "quiz_pass": {
      totalXp += xpForEvent("quiz_pass");
      await prisma.quizResult.create({
        data: {
          id: newId(),
          userId,
          moduleId: event.moduleId,
          score: event.score ?? 100,
          passed: event.passed ?? true,
          metadata: { eventType: event.eventType },
        },
      });
      break;
    }
    case "interpretation": {
      if (event.moduleId === "iota") {
        if (event.correct) {
          iotaCorrectStreak += 1;
          totalXp += xpForEvent("interpretation");
        } else {
          iotaCorrectStreak = 0;
        }
      }
      break;
    }
    case "module_progress": {
      if (event.moduleId === "fmf") {
        stats.fmfCompleted = event.fmfCompleted ?? stats.fmfCompleted;
        stats.fmfTotal = event.fmfTotal ?? stats.fmfTotal;
      }
      break;
    }
    default:
      break;
  }

  const level = levelFromXp(totalXp);

  progress = await prisma.userProgress.update({
    where: { userId },
    data: {
      totalXp,
      level,
      streakDays,
      iotaCorrectStreak,
      lastActiveDate,
      stats: stats as object,
    },
  });

  const [catalogRows, unlockedRows] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { slug: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const unlockedSlugs = new Set(unlockedRows.map((u) => u.achievement.slug));
  const newlyUnlocked: UnlockedAchievement[] = [];
  let bonusXpFromBadges = 0;

  for (const row of catalogRows) {
    if (unlockedSlugs.has(row.slug)) continue;

    const item: AchievementCatalogItem = {
      slug: row.slug,
      name: row.name,
      description: row.description,
      iconEmoji: row.iconEmoji,
      xpReward: row.xpReward,
      criteriaType: row.criteriaType as AchievementCriteriaType,
      criteriaValue: row.criteriaValue,
      moduleId: (row.moduleId as ClinicalModuleId | null) ?? null,
    };

    if (!evaluateAchievementCriteria(item, { stats, streakDays, iotaCorrectStreak })) {
      continue;
    }

    const unlocked = await prisma.userAchievement.create({
      data: {
        id: newId(),
        userId,
        achievementId: row.id,
      },
      include: { achievement: true },
    });

    bonusXpFromBadges += row.xpReward;
    unlockedSlugs.add(row.slug);
    newlyUnlocked.push({
      slug: unlocked.achievement.slug,
      name: unlocked.achievement.name,
      description: unlocked.achievement.description,
      iconEmoji: unlocked.achievement.iconEmoji,
      xpReward: unlocked.achievement.xpReward,
      unlockedAt: unlocked.unlockedAt.toISOString(),
    });
  }

  if (bonusXpFromBadges > 0) {
    totalXp += bonusXpFromBadges;
    await prisma.userProgress.update({
      where: { userId },
      data: {
        totalXp,
        level: levelFromXp(totalXp),
      },
    });
  }

  const xpMeta = xpProgressInLevel(totalXp);

  return {
    newlyUnlocked,
    progress: {
      totalXp,
      level: levelFromXp(totalXp),
      streakDays,
      ...xpMeta,
    },
    stats,
  };
}

/** Проверка одного бейджа — добавляйте case для новых criteriaType */
function evaluateAchievementCriteria(
  item: AchievementCatalogItem,
  ctx: { stats: ProgressStats; streakDays: number; iotaCorrectStreak: number },
): boolean {
  switch (item.criteriaType) {
    case "CASES_COMPLETED": {
      const mod = item.moduleId ?? "general";
      return (ctx.stats.casesByModule[mod] ?? 0) >= item.criteriaValue;
    }
    case "CORRECT_STREAK":
      return ctx.iotaCorrectStreak >= item.criteriaValue;
    case "LESSONS_COMPLETED":
      return ctx.stats.lessonsCompleted >= item.criteriaValue;
    case "LOGIN_STREAK":
      return ctx.streakDays >= item.criteriaValue;
    case "MODULE_COMPLETION": {
      if (item.moduleId === "fmf" && ctx.stats.fmfTotal > 0) {
        const pct = Math.round((ctx.stats.fmfCompleted / ctx.stats.fmfTotal) * 100);
        return pct >= item.criteriaValue;
      }
      return false;
    }
    default:
      return false;
  }
}

export async function getUserAchievementsPayload(userId: string): Promise<UserAchievementsPayload> {
  await ensureAchievementCatalog();
  const progress = await getOrCreateProgress(userId);

  const [catalogRows, unlockedRows] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { slug: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const unlockedMap = new Map(
    unlockedRows.map((u) => [u.achievement.slug, u.unlockedAt.toISOString()] as const),
  );

  const achievements: AchievementWithStatus[] = catalogRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconEmoji: row.iconEmoji,
    xpReward: row.xpReward,
    criteriaType: row.criteriaType as AchievementCriteriaType,
    criteriaValue: row.criteriaValue,
    moduleId: (row.moduleId as ClinicalModuleId | null) ?? null,
    unlocked: unlockedMap.has(row.slug),
    unlockedAt: unlockedMap.get(row.slug) ?? null,
  }));

  const xpMeta = xpProgressInLevel(progress.totalXp);
  const stats = parseStats(progress.stats);

  return {
    progress: {
      totalXp: progress.totalXp,
      level: progress.level,
      streakDays: progress.streakDays,
      ...xpMeta,
    },
    achievements,
    stats,
  };
}
