"use client";

import { getMedvedevBiometryBand, MEDVEDEV_BIOMETRY_MIN_WEEK, MEDVEDEV_BIOMETRY_MAX_WEEK } from "@repo/medvedev-reference";

/** EFW growth curves: p5 / p50 / p95 по Медведеву (Hadlock IV). */
const WEEKS = Array.from(
  { length: MEDVEDEV_BIOMETRY_MAX_WEEK - MEDVEDEV_BIOMETRY_MIN_WEEK + 1 },
  (_, i) => MEDVEDEV_BIOMETRY_MIN_WEEK + i,
);

type Point = { week: number; grams: number };

type Props = {
  points: Point[];
  width?: number;
  height?: number;
};

function bandAtWeek(week: number) {
  return getMedvedevBiometryBand(week, "efw");
}

export function FetalGrowthChart({ points, width = 480, height = 220 }: Props) {
  const pad = { l: 48, r: 16, t: 16, b: 32 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const minW = MEDVEDEV_BIOMETRY_MIN_WEEK;
  const maxW = MEDVEDEV_BIOMETRY_MAX_WEEK;
  const minG = 0;
  const maxG = 4200;

  const x = (w: number) => pad.l + ((w - minW) / (maxW - minW)) * innerW;
  const y = (g: number) => pad.t + innerH - ((g - minG) / (maxG - minG)) * innerH;

  const p50Values = WEEKS.map((w) => bandAtWeek(w)?.p50 ?? 0);
  const p5Values = WEEKS.map((w) => bandAtWeek(w)?.p5 ?? 0);
  const p95Values = WEEKS.map((w) => bandAtWeek(w)?.p95 ?? 0);

  const pathFrom = (values: number[]) =>
    WEEKS.map((w, i) => `${i === 0 ? "M" : "L"}${x(w)},${y(values[i])}`).join(" ");

  const medianPath = pathFrom(p50Values);
  const upperPath = pathFrom(p95Values);
  const lowerPath = pathFrom(p5Values);
  const bandFill = `${upperPath} ${WEEKS.slice()
    .reverse()
    .map((w, i) => `L${x(w)},${y(p5Values[WEEKS.length - 1 - i])}`)
    .join(" ")} Z`;

  return (
    <svg width={width} height={height} className="max-w-full" role="img" aria-label="Кривая роста плода">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <path d={bandFill} fill="rgba(56,189,248,0.12)" />
      <path d={lowerPath} fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth={1} strokeDasharray="4 3" />
      <path d={upperPath} fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth={1} strokeDasharray="4 3" />
      <path d={medianPath} fill="none" stroke="var(--clinical-primary)" strokeWidth={2} />
      {points.map((p) => (
        <circle key={`${p.week}-${p.grams}`} cx={x(p.week)} cy={y(p.grams)} r={5} fill="#f59e0b" />
      ))}
      <text x={pad.l} y={height - 8} className="fill-[var(--clinical-foreground-muted)] text-[10px]">
        Недели → · полоса p5–p95 (Медведев)
      </text>
      <text
        x={12}
        y={pad.t + innerH / 2}
        transform={`rotate(-90 12 ${pad.t + innerH / 2})`}
        className="fill-[var(--clinical-foreground-muted)] text-[10px]"
      >
        EFW (г)
      </text>
    </svg>
  );
}
