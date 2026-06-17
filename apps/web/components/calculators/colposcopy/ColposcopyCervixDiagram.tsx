"use client";

import type { SwedeScoreInput } from "@/lib/colposcopy";
import { cn } from "@/lib/utils/cn";

type AnnotationColor = "green" | "yellow" | "red" | "white";

export type CervixAnnotation = {
  x: number;
  y: number;
  color: AnnotationColor;
};

type Props = {
  swede: SwedeScoreInput;
  annotations: CervixAnnotation[];
  annotationColor: AnnotationColor;
  onAnnotate: (x: number, y: number) => void;
  className?: string;
};

const COLOR_LABELS: Record<AnnotationColor, string> = {
  green: "Норма",
  yellow: "Ацетобелый",
  red: "Сосуды",
  white: "Йод-негатив",
};

export function ColposcopyCervixDiagram({
  swede,
  annotations,
  annotationColor,
  onAnnotate,
  className,
}: Props) {
  const awOpacity = Math.min(swede.acetowhite * 0.35 + 0.08, 0.85);
  const lesionR = 38 + swede.lesionSize * 12;
  const vesselsOpacity = swede.vessels === 2 ? 1 : swede.vessels === 1 ? 0.25 : 0.08;
  const iodineOpacity = swede.iodine === 2 ? 0.75 : swede.iodine === 1 ? 0.4 : 0;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    onAnnotate(x, y);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <svg
        viewBox="0 0 300 300"
        className="mx-auto w-full max-w-[300px] cursor-crosshair rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-pink-50 p-2 shadow-sm"
        role="img"
        aria-label="Схема шейки матки для кольпоскопии"
        onClick={handleClick}
      >
        <circle cx="150" cy="150" r="120" fill="#f2d9d9" stroke="#b38b8b" strokeWidth="2" />
        <circle cx="150" cy="150" r="100" fill="#f7c8c8" />
        <circle cx="150" cy="150" r="70" fill="#f0b0b0" stroke="#d49494" strokeWidth="1.5" />
        <circle cx="150" cy="150" r="30" fill="#d48080" />

        {iodineOpacity > 0 ? (
          <circle
            cx="150"
            cy="150"
            r={55}
            fill={`rgba(100,116,139,${iodineOpacity})`}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ) : null}

        <circle cx="150" cy="150" r={lesionR} fill={`rgba(255,255,255,${awOpacity})`} />

        <g opacity={vesselsOpacity}>
          <circle cx="130" cy="130" r="4" fill="#b22234" />
          <circle cx="160" cy="135" r="4" fill="#b22234" />
          <circle cx="170" cy="155" r="3" fill="#b22234" />
          <line x1="115" y1="150" x2="185" y2="150" stroke="#b22234" strokeWidth="2" />
          <line x1="150" y1="115" x2="150" y2="185" stroke="#b22234" strokeWidth="2" />
        </g>

        <line x1="150" y1="35" x2="150" y2="265" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="35" y1="150" x2="265" y2="150" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />

        {annotations.map((a, i) => (
          <g key={`${a.x}-${a.y}-${i}`}>
            <circle
              cx={a.x}
              cy={a.y}
              r="9"
              fill={
                a.color === "green"
                  ? "rgba(34,197,94,0.55)"
                  : a.color === "yellow"
                    ? "rgba(234,179,8,0.65)"
                    : a.color === "red"
                      ? "rgba(220,38,38,0.65)"
                      : "rgba(148,163,184,0.7)"
              }
              stroke="#fff"
              strokeWidth="2"
            />
          </g>
        ))}

        <text x="150" y="285" textAnchor="middle" fontSize="11" fill="#4a2f2f" fontWeight="600">
          Клик — отметить зону ({COLOR_LABELS[annotationColor]})
        </text>
      </svg>
      <p className="text-center text-[10px] text-[var(--clinical-foreground-muted)]">
        Учебная схема · не фото пациента · зоны сохраняются только локально
      </p>
    </div>
  );
}

export { COLOR_LABELS as ANNOTATION_COLOR_LABELS };
export type { AnnotationColor };
