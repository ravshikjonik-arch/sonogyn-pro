"use client";

import { useMemo } from "react";

import type { NomogramChartSeries } from "@repo/fetal-nomograms";

type Props = {
  series: NomogramChartSeries;
  /** X in same units as series (weeks or CRL mm midpoint scale) */
  markerX?: number;
  markerY?: number;
  className?: string;
};

const W = 420;
const H = 220;
const PAD = { t: 12, r: 16, b: 36, l: 44 };

function scale(value: number, min: number, max: number, outMin: number, outMax: number) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

export function NomogramChart({ series, markerX, markerY, className }: Props) {
  const layout = useMemo(() => {
    const xs = series.points.map((p) => p.x);
    const ys = series.points.flatMap((p) => [p.p5, p.p50, p.p95].filter((v): v is number => v != null));
    if (markerY != null) ys.push(markerY);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const sx = (x: number) => scale(x, xMin, xMax, PAD.l, PAD.l + innerW);
    const sy = (y: number) => scale(y, yMin, yMax, PAD.t + innerH, PAD.t);
    const line = (field: "p5" | "p50" | "p95") =>
      series.points
        .filter((p) => p[field] != null)
        .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p[field]!).toFixed(1)}`)
        .join(" ");
    return { sx, sy, line, xMin, xMax, yMin, yMax };
  }, [series, markerY]);

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-lg text-[var(--clinical-foreground)]"
        role="img"
        aria-label={`Номограмма ${series.title}`}
      >
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {[layout.line("p5"), layout.line("p50"), layout.line("p95")].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={i === 1 ? 2 : 1}
            opacity={i === 1 ? 0.85 : 0.45}
            strokeDasharray={i === 0 || i === 2 ? "4 3" : undefined}
          />
        ))}
        {markerX != null && markerY != null ? (
          <circle
            cx={layout.sx(markerX)}
            cy={layout.sy(markerY)}
            r={5}
            fill="var(--clinical-primary-deep, #0d9488)"
            stroke="var(--clinical-background)"
            strokeWidth={2}
          />
        ) : null}
        <text x={PAD.l} y={H - 10} className="fill-[var(--clinical-muted-foreground)] text-[10px]">
          {series.xAxisLabel}
        </text>
        <text
          x={8}
          y={PAD.t + 8}
          className="fill-[var(--clinical-muted-foreground)] text-[10px]"
          transform={`rotate(-90 8 ${PAD.t + 8})`}
        >
          {series.unit}
        </text>
      </svg>
      <figcaption className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-xs">
        <span>{series.percentileLabels.low}</span>
        <span>{series.percentileLabels.mid}</span>
        <span>{series.percentileLabels.high}</span>
        {markerX != null && markerY != null ? (
          <span className="text-[var(--clinical-primary-deep)]">● текущий замер</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
