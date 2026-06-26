"use client";

type Props = {
  level: number;
  totalXp: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  streakDays?: number;
};

export function LevelProgressBar({
  level,
  totalXp,
  xpInCurrentLevel,
  xpToNextLevel,
  xpProgressPercent,
  streakDays = 0,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90">Уровень</p>
          <p className="text-3xl font-black text-white">
            {level}
            <span className="ml-2 text-lg text-amber-300">⭐</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Всего XP</p>
          <p className="text-xl font-bold text-slate-100">{totalXp}</p>
          {streakDays > 0 ? (
            <p className="mt-1 text-xs text-orange-400">🔥 {streakDays} дн. подряд</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>
            {xpInCurrentLevel} / 100 XP до уровня {level + 1}
          </span>
          <span>{xpProgressPercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
            style={{ width: `${xpProgressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Ещё {xpToNextLevel} XP до следующего уровня</p>
      </div>
    </div>
  );
}
