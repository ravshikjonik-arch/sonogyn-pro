"use client";

import type { AchievementWithStatus } from "@/lib/achievements/types";

type Props = {
  achievement: AchievementWithStatus;
  /** Недавно разблокирован — анимация появления */
  justUnlocked?: boolean;
};

export function AchievementBadge({ achievement, justUnlocked = false }: Props) {
  const locked = !achievement.unlocked;

  return (
    <article
      className={[
        "group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-500",
        locked
          ? "border-slate-700/80 bg-slate-900/40 opacity-55 grayscale"
          : "border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg shadow-amber-500/10",
        justUnlocked ? "animate-[achievement-pop_0.6s_ease-out]" : "",
      ].join(" ")}
      title={achievement.description}
    >
      <span
        className={[
          "text-4xl transition-transform duration-300",
          locked ? "" : "group-hover:scale-110",
          justUnlocked ? "animate-bounce" : "",
        ].join(" ")}
        aria-hidden
      >
        {locked ? "🔒" : achievement.iconEmoji}
      </span>
      <h3 className="mt-2 text-sm font-bold text-slate-100">{achievement.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">{achievement.description}</p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
        +{achievement.xpReward} XP
      </p>
      {achievement.unlocked && achievement.unlockedAt ? (
        <p className="mt-1 text-[10px] text-slate-500">
          {new Date(achievement.unlockedAt).toLocaleDateString("ru-RU")}
        </p>
      ) : null}
    </article>
  );
}
