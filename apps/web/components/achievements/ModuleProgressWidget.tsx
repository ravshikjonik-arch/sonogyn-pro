"use client";

import type { ClinicalModuleId } from "@/lib/achievements/types";
import { moduleAchievementHint } from "@/lib/achievements/hints";

type Props = {
  moduleId: ClinicalModuleId;
  /** case_complete | lesson_complete | quiz_pass */
  eventType?: "case_complete" | "lesson_complete" | "quiz_pass";
  className?: string;
};

/**
 * Виджет внизу урока/кейса — сколько XP даст действие и к какому бейджу ведёт.
 */
export function ModuleProgressWidget({
  moduleId,
  eventType = "case_complete",
  className = "",
}: Props) {
  const hint = moduleAchievementHint(moduleId);
  const xp =
    eventType === "lesson_complete" ? 15 : eventType === "quiz_pass" ? 20 : hint.xpOnComplete;

  return (
    <aside
      className={[
        "rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
        Прогресс · {hint.label}
      </p>
      <p className="mt-1 text-slate-200">
        За прохождение: <span className="font-bold text-amber-300">+{xp} XP</span>
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint.criteriaHint}</p>
    </aside>
  );
}
