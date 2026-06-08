"use client";

/** Simplified EFW growth curves (median ±2 SD bands) for visualization. */
const WEEKS = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
const MEDIAN = [350, 500, 700, 950, 1250, 1600, 1950, 2300, 2700, 3100, 3450];
const SD = [70, 85, 110, 140, 175, 210, 245, 280, 320, 360, 390];

type Point = { week: number; grams: number };

type Props = {
  points: Point[];
  width?: number;
  height?: number;
};

export function FetalGrowthChart({ points, width = 480, height = 220 }: Props) {
  const pad = { l: 48, r: 16, t: 16, b: 32 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const minW = 20;
  const maxW = 40;
  const minG = 0;
  const maxG = 4000;

  const x = (w: number) => pad.l + ((w - minW) / (maxW - minW)) * innerW;
  const y = (g: number) => pad.t + innerH - ((g - minG) / (maxG - minG)) * innerH;

  const medianPath = WEEKS.map((w, i) => `${i === 0 ? "M" : "L"}${x(w)},${y(MEDIAN[i])}`).join(" ");
  const upperPath = WEEKS.map((w, i) => `${i === 0 ? "M" : "L"}${x(w)},${y(MEDIAN[i] + 2 * SD[i])}`).join(" ");
  const lowerPath = WEEKS.map((w, i) => `${i === 0 ? "M" : "L"}${x(w)},${y(Math.max(0, MEDIAN[i] - 2 * SD[i]))}`).join(" ");

  return (
    <svg width={width} height={height} className="max-w-full" role="img" aria-label="Кривая роста плода">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <path d={`${upperPath} ${lowerPath.replace(/M/g, "L").split(" ").reverse().join(" ")} Z`} fill="rgba(56,189,248,0.12)" />
      <path d={medianPath} fill="none" stroke="var(--clinical-primary)" strokeWidth={2} />
      {points.map((p) => (
        <circle key={`${p.week}-${p.grams}`} cx={x(p.week)} cy={y(p.grams)} r={5} fill="#f59e0b" />
      ))}
      <text x={pad.l} y={height - 8} className="fill-[var(--clinical-foreground-muted)] text-[10px]">
        Недели →
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
