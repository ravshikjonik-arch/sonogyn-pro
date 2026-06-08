"use client";

import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

export type PelvicDiagramRegion = {
  id: string;
  label: string;
  /** SVG rect in viewBox 0 0 360 280 */
  x: number;
  y: number;
  w: number;
  h: number;
};

const REGIONS: PelvicDiagramRegion[] = [
  { id: "anterior_compartment", label: "Передний отдел (матка — мочевой пузырь)", x: 120, y: 40, w: 120, h: 70 },
  { id: "posterior_compartment", label: "Задний отдел (матка — прямая кишка)", x: 120, y: 150, w: 120, h: 80 },
  { id: "right_adnexa", label: "Правая яичниковая ямка", x: 250, y: 110, w: 90, h: 70 },
  { id: "left_adnexa", label: "Левая яичниковая ямка", x: 20, y: 110, w: 90, h: 70 },
];

export type AnatomicalDiagramProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  testId?: string;
};

/**
 * Схема малого таза: каждая зона — переключаемая кнопка; для скринридеров — live-область.
 */
export function AnatomicalDiagram({ selectedIds, onChange, className, testId }: AnatomicalDiagramProps) {
  const liveId = useId();
  const [lastAction, setLastAction] = useState<string>("");

  const liveText = useMemo(() => {
    if (selectedIds.length === 0) return "На схеме не выбраны области.";
    const labels = REGIONS.filter((r) => selectedIds.includes(r.id)).map((r) => r.label);
    return `Выбранные области: ${labels.join("; ")}.`;
  }, [selectedIds]);

  function toggle(id: string) {
    const has = selectedIds.includes(id);
    const next = has ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    onChange(next);
    const region = REGIONS.find((r) => r.id === id);
    setLastAction(has ? `Снята отметка: ${region?.label ?? id}` : `Добавлена отметка: ${region?.label ?? id}`);
  }

  return (
    <div className={cn("space-y-2", className)} data-testid={testId}>
      <div aria-live="polite" aria-atomic="true" id={liveId} className="sr-only">
        {lastAction}. {liveText}
      </div>
      <p className="text-xs text-[var(--clinical-foreground-muted)]" aria-hidden="true">
        {liveText}
      </p>
      <svg
        viewBox="0 0 360 280"
        role="img"
        aria-label="Схема отделов малого таза для отметки зон при оценке признака скольжения"
        className="w-full max-w-md rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50"
      >
        <title>Схема отделов малого таза</title>
        {REGIONS.map((r) => {
          const pressed = selectedIds.includes(r.id);
          return (
            <rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={10}
              role="button"
              tabIndex={0}
              aria-pressed={pressed}
              aria-label={r.label}
              className={cn(
                "cursor-pointer stroke-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-ring)]",
                pressed ? "fill-sky-500/35 stroke-sky-600" : "fill-white/80 stroke-slate-400 hover:fill-sky-100/80",
              )}
              onClick={() => toggle(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(r.id);
                }
              }}
            />
          );
        })}
        <text x="180" y="270" textAnchor="middle" className="fill-slate-500 text-[11px]">
          Схема ориентировочная, не в масштабе
        </text>
      </svg>
      <ul className="text-xs text-[var(--clinical-foreground-muted)]">
        {REGIONS.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="text-left underline-offset-2 hover:underline"
              onClick={() => toggle(r.id)}
            >
              {r.label} {selectedIds.includes(r.id) ? "✓" : ""}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
