"use client";

import type { CategoricalResult, PercentileResult } from "@repo/fmf";
import { FMF_ENGINE_DISCLAIMER } from "@repo/fmf";
import { cn } from "@/lib/utils/cn";

type FirstTrimesterPercentilePanelProps = {
  measurements: PercentileResult[];
  categorical?: CategoricalResult[];
  compact?: boolean;
};

function flagClass(flag?: PercentileResult["flag"]): string {
  switch (flag) {
    case "critical_high":
    case "high":
      return "bg-red-100/80 text-red-950 dark:bg-red-950/30 dark:text-red-100";
    case "critical_low":
    case "low":
      return "bg-amber-100/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100";
    case "normal":
      return "bg-emerald-100/60 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100";
    default:
      return "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]";
  }
}

function MetricRow({ m }: { m: PercentileResult }) {
  return (
    <tr className={cn("border-b border-[var(--clinical-border)]/60", flagClass(m.flag))}>
      <td className="px-2 py-2 font-semibold">{m.labelRu}</td>
      <td className="px-2 py-2 tabular-nums">{Number.isFinite(m.value) ? m.value : "—"}</td>
      <td className="px-2 py-2 tabular-nums">{Number.isFinite(m.expected) ? m.expected : "—"}</td>
      <td className="px-2 py-2 tabular-nums">{Number.isFinite(m.sd) ? m.sd : "—"}</td>
      <td className="px-2 py-2 tabular-nums font-bold">
        {Number.isFinite(m.percentile) ? `~${m.percentile}` : "—"}
      </td>
      <td className="px-2 py-2 tabular-nums">{Number.isFinite(m.zScore) ? m.zScore : "—"}</td>
      <td className="px-2 py-2 tabular-nums">{Number.isFinite(m.mom) ? m.mom : "—"}</td>
      <td className="px-2 py-2 text-[11px] leading-snug">{m.interpretation}</td>
    </tr>
  );
}

function MiniCurve({ m }: { m: PercentileResult }) {
  if (!m.band) return null;
  const min = m.band.p3;
  const max = m.band.p97;
  const span = max - min || 1;
  const pct = (v: number) => `${((v - min) / span) * 100}%`;
  const valPct = `${((m.value - min) / span) * 100}%`;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
        {m.labelRu}
      </p>
      <div className="relative h-8 rounded-full bg-[var(--clinical-muted)]/60">
        <div className="absolute inset-y-2 left-[10%] right-[10%] rounded-full bg-indigo-200/50 dark:bg-indigo-900/30" />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-indigo-600"
          style={{ left: pct(m.band.p50) }}
          title="P50"
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow"
          style={{ left: valPct }}
          title="Измерение"
        />
      </div>
      <div className="flex justify-between text-[9px] text-[var(--clinical-foreground-muted)]">
        <span>P3 {m.band.p3}</span>
        <span>P50 {m.band.p50}</span>
        <span>P97 {m.band.p97}</span>
      </div>
    </div>
  );
}

export function FirstTrimesterPercentilePanel({
  measurements,
  categorical = [],
  compact,
}: FirstTrimesterPercentilePanelProps) {
  if (!measurements.length && !categorical.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20",
        compact ? "space-y-2" : "space-y-4",
      )}
    >
      <div>
        <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100">
          FMF Percentile Engine · I скрининг
        </p>
        <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">{FMF_ENGINE_DISCLAIMER}</p>
      </div>

      {measurements.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--clinical-border)]/60 bg-white/50 dark:bg-slate-950/20">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-[var(--clinical-muted)]/50 text-[10px] uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              <tr>
                <th className="px-2 py-2">Параметр</th>
                <th className="px-2 py-2">Измерено</th>
                <th className="px-2 py-2">Expected</th>
                <th className="px-2 py-2">SD</th>
                <th className="px-2 py-2">Перц.</th>
                <th className="px-2 py-2">Z</th>
                <th className="px-2 py-2">MoM</th>
                <th className="px-2 py-2">Интерпретация</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => (
                <MetricRow key={m.parameterId} m={m} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!compact && measurements.some((m) => m.band) ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {measurements.filter((m) => m.band).map((m) => (
            <MiniCurve key={`curve-${m.parameterId}`} m={m} />
          ))}
        </div>
      ) : null}

      {categorical.length > 0 ? (
        <ul className="space-y-2 text-xs">
          {categorical.map((c) => (
            <li
              key={c.parameterId}
              className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 py-2"
            >
              <span className="font-semibold">{c.labelRu}</span>
              {c.likelihoodRatio != null ? (
                <span className="ml-2 font-bold">LR {c.likelihoodRatio}</span>
              ) : null}
              <p className="mt-1 text-[11px] text-[var(--clinical-foreground-muted)]">{c.interpretation}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
