"use client";

import { cn } from "@/lib/utils/cn";
import type { PopQInput, PopQPointKey } from "@/lib/popq";

const HYMEN_Y = 200;
const PX_PER_CM = 11;
const POSITIONS: Record<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D", { x: number }> = {
  Aa: { x: 88 },
  Ba: { x: 108 },
  C: { x: 150 },
  D: { x: 168 },
  Ap: { x: 88 },
  Bp: { x: 108 },
};

function yForCm(cm: number | undefined): number {
  if (cm === undefined) return HYMEN_Y;
  return HYMEN_Y + cm * PX_PER_CM;
}

type Props = {
  input: PopQInput;
  uterusPresent: boolean;
  showNormal: boolean;
  normalInput: PopQInput;
  showLabels: boolean;
  leadingPoint?: PopQPointKey | null;
};

function PointDot({
  label,
  cm,
  x,
  highlight,
  showLabel,
}: {
  label: string;
  cm?: number;
  x: number;
  highlight?: boolean;
  showLabel: boolean;
}) {
  if (cm === undefined) return null;
  const y = yForCm(cm);
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={highlight ? 9 : 7}
        className={cn(
          highlight ? "fill-rose-600 stroke-white" : "fill-violet-700 stroke-white",
          "stroke-2",
        )}
      />
      {showLabel ? (
        <text x={x} y={y - 12} textAnchor="middle" className="fill-slate-800 text-[10px] font-bold">
          {label} ({cm})
        </text>
      ) : null}
    </g>
  );
}

export function PopQDiagram({
  input,
  uterusPresent,
  showNormal,
  normalInput,
  showLabels,
  leadingPoint,
}: Props) {
  const display = showNormal ? normalInput : input;
  const wallKeys: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = uterusPresent
    ? ["Aa", "Ba", "C", "D", "Ap", "Bp"]
    : ["Aa", "Ba", "C", "Ap", "Bp"];

  return (
    <div className="overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-b from-orange-50 to-rose-50 p-2">
      <svg viewBox="0 0 300 280" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="Схема POP-Q">
        <rect x="0" y="0" width="300" height="280" fill="transparent" />
        {/* vaginal canal */}
        <ellipse cx="150" cy="120" rx="52" ry="88" fill="#ffe4e6" stroke="#fb7185" strokeWidth="3" />
        {/* hymen */}
        <line x1="70" y1={HYMEN_Y} x2="230" y2={HYMEN_Y} stroke="#7c2d12" strokeWidth="2" strokeDasharray="4 2" />
        <text x="235" y={HYMEN_Y + 4} className="fill-amber-900 text-[9px] font-bold">
          гимен 0
        </text>
        <text x="24" y="36" className="fill-rose-900 text-[10px] font-bold">
          {showNormal ? "Нормальная анатомия" : "Ваши измерения"}
        </text>
        <text x="24" y="52" className="fill-slate-600 text-[9px]">
          минус — выше гимена, плюс — ниже
        </text>

        {wallKeys.map((key) => (
          <PointDot
            key={key}
            label={key}
            cm={display[key]}
            x={POSITIONS[key].x}
            highlight={!showNormal && leadingPoint === key}
            showLabel={showLabels}
          />
        ))}

        {/* GH / PB / TVL guides */}
        {display.GH !== undefined ? (
          <line x1="58" y1={HYMEN_Y} x2="58" y2={HYMEN_Y + display.GH * PX_PER_CM} stroke="#2563eb" strokeWidth="2" />
        ) : null}
        {display.PB !== undefined ? (
          <line
            x1="242"
            y1={HYMEN_Y}
            x2="242"
            y2={HYMEN_Y + display.PB * PX_PER_CM}
            stroke="#7c3aed"
            strokeWidth="2"
          />
        ) : null}
      </svg>
      <p className="px-2 pb-1 text-center text-[10px] text-slate-600">
        Схема для обучения. Не заменяет клинический осмотр.
      </p>
    </div>
  );
}
