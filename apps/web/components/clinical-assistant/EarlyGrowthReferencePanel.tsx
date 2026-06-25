"use client";

import {
  EARLY_PREGNANCY_GROWTH_SOURCE,
  growthCurveSeries,
  type EarlyBiometryAssessment,
  type EarlyBiometryParameter,
} from "@repo/medical-calculations/early-pregnancy";
import { cn } from "@/lib/utils/cn";

type EarlyGrowthCurveChartProps = {
  parameter: EarlyBiometryParameter;
  highlight?: EarlyBiometryAssessment | null;
  className?: string;
};

const PARAM_TITLES: Record<EarlyBiometryParameter, string> = {
  msd: "Плодное яйцо (MSD)",
  ysd: "Желточный мешок (YSD)",
  crl: "Эмбрион (CRL)",
};

export function EarlyGrowthCurveChart({ parameter, highlight, className }: EarlyGrowthCurveChartProps) {
  const series = growthCurveSeries(parameter);
  const width = 320;
  const height = 160;
  const pad = { l: 28, r: 8, t: 12, b: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const minGa = series[0]!.gaDays;
  const maxGa = series[series.length - 1]!.gaDays;
  const maxY = Math.max(...series.map((r) => r.band.p95)) * 1.1;

  const x = (gaDays: number) => pad.l + ((gaDays - minGa) / (maxGa - minGa)) * innerW;
  const y = (mm: number) => pad.t + innerH - (mm / maxY) * innerH;

  const line = (key: "p5" | "p50" | "p95") =>
    series
      .map((row, i) => `${i === 0 ? "M" : "L"} ${x(row.gaDays).toFixed(1)} ${y(row.band[key]).toFixed(1)}`)
      .join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100">{PARAM_TITLES[parameter]}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md rounded-lg bg-white/60 dark:bg-slate-950/30" role="img">
        <path d={line("p95")} fill="none" stroke="rgb(251 191 36 / 0.5)" strokeWidth="1.5" />
        <path d={line("p50")} fill="none" stroke="rgb(99 102 241 / 0.9)" strokeWidth="2" />
        <path d={line("p5")} fill="none" stroke="rgb(251 191 36 / 0.5)" strokeWidth="1.5" />
        {highlight?.parameter === parameter && Number.isFinite(highlight.valueMm) ? (
          <circle
            cx={x(highlight.gaDays)}
            cy={y(highlight.valueMm)}
            r={4}
            className="fill-rose-500 stroke-white stroke-[1.5]"
          />
        ) : null}
        {[minGa, maxGa].map((ga) => (
          <text key={ga} x={x(ga)} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[9px]">
            {Math.floor(ga / 7)}+{ga % 7}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 text-[10px] text-[var(--clinical-foreground-muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 bg-indigo-500" /> P50
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 bg-amber-400/80" /> P5 / P95
        </span>
        {highlight?.parameter === parameter ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> измерение
          </span>
        ) : null}
      </div>
      <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">{EARLY_PREGNANCY_GROWTH_SOURCE}</p>
    </div>
  );
}

type EarlyGrowthReferencePanelProps = {
  assessments: EarlyBiometryAssessment[];
  compact?: boolean;
};

export function EarlyGrowthReferencePanel({ assessments, compact }: EarlyGrowthReferencePanelProps) {
  if (!assessments.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-violet-200/80 bg-violet-50/50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20",
        compact ? "space-y-2" : "space-y-3",
      )}
    >
      <p className="text-xs font-bold text-violet-950 dark:text-violet-100">Референсные кривые · малый срок</p>
      <ul className={cn("space-y-2", compact ? "text-xs" : "text-sm")}>
        {assessments.map((m) => (
          <li
            key={m.parameter}
            className={cn(
              "rounded-lg px-2 py-1.5",
              (m.flag === "critical_high" || m.flag === "high") &&
                "bg-red-100/80 text-red-950 dark:bg-red-950/30 dark:text-red-100",
              (m.flag === "critical_low" || m.flag === "low") &&
                "bg-amber-100/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100",
              m.flag === "normal" && "bg-emerald-100/60 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100",
              (m.flag === "unknown" || m.flag === "out_of_range") &&
                "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]",
            )}
          >
            <span className="font-semibold">{m.label}</span>
            {m.percentile !== undefined ? (
              <span className="ml-2 font-bold">~{m.percentile}-й перц.</span>
            ) : null}
            <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{m.summary}</p>
          </li>
        ))}
      </ul>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(["msd", "ysd", "crl"] as const).map((param) => (
          <EarlyGrowthCurveChart
            key={param}
            parameter={param}
            highlight={assessments.find((a) => a.parameter === param) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
