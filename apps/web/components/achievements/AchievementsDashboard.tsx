"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useAchievements } from "@/hooks/useAchievements";

import { AchievementBadge } from "./AchievementBadge";
import { LevelProgressBar } from "./LevelProgressBar";

export function AchievementsDashboard() {
  const { data, loading, error, refresh } = useAchievements();
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slugs: string[] }>).detail;
      if (detail?.slugs?.length) {
        setRecentSlugs(detail.slugs);
        void refresh();
        window.setTimeout(() => setRecentSlugs([]), 4000);
      }
    };
    window.addEventListener("achievements-unlocked", handler);
    return () => window.removeEventListener("achievements-unlocked", handler);
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка наград…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6 text-sm text-amber-100">
        {error}
        <p className="mt-2 text-xs text-amber-200/70">
          Примените миграцию <code className="rounded bg-black/30 px-1">20260627120000_achievements_gamification.sql</code>{" "}
          и задайте DATABASE_URL.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const unlockedCount = data.achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90">Звёзды и награды</p>
        <h2 className="mt-1 text-2xl font-black text-white">Образовательная геймификация</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          O-RADS, IOTA, BI-RADS, TI-RADS, FMF — за кейсы, уроки и ежедневную практику. Открыто{" "}
          <span className="font-semibold text-slate-200">{unlockedCount}</span> из {data.achievements.length} бейджей.
        </p>
      </header>

      <LevelProgressBar
        level={data.progress.level}
        totalXp={data.progress.totalXp}
        xpInCurrentLevel={data.progress.xpInCurrentLevel}
        xpToNextLevel={data.progress.xpToNextLevel}
        xpProgressPercent={data.progress.xpProgressPercent}
        streakDays={data.progress.streakDays}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.slug}
            achievement={achievement}
            justUnlocked={recentSlugs.includes(achievement.slug)}
          />
        ))}
      </div>
    </div>
  );
}
