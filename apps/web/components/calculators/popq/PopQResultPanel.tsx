"use client";

import { compartmentLabel, stageLabel, type PopQStageResult } from "@/lib/popq";
import { cn } from "@/lib/utils/cn";

type Props = {
  result: PopQStageResult;
  className?: string;
};

export function PopQResultPanel({ result, className }: Props) {
  const stageTone =
    result.stageKey === "0" || result.stageKey === "1"
      ? "border-emerald-300 bg-emerald-50"
      : result.stageKey === "2"
        ? "border-amber-300 bg-amber-50"
        : "border-rose-300 bg-rose-50";

  return (
    <div className={cn("space-y-3 rounded-2xl border-2 p-5", stageTone, className)}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Результат</p>
      <p className="text-4xl font-black text-[var(--clinical-foreground)]">{stageLabel(result.stageKey)}</p>
      <p className="text-sm leading-relaxed text-[var(--clinical-foreground)]">{result.stageDescription}</p>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-800">
          Самая низкая точка: {result.maxPoint != null ? `${result.maxPoint} см` : "—"}
        </span>
        {result.leadingPoint ? (
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-800">
            Ведущая точка: {result.leadingPoint}
          </span>
        ) : null}
        {result.leading ? (
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-800">
            {compartmentLabel(result.leading.key)}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Учтённые точки (см): {result.pointsUsedLabel}
      </p>
    </div>
  );
}
