"use client";

import { ORADS_RUSSIAN_VISUAL_CRITERIA } from "@/lib/orads-pro/russian-visual-criteria";
import { cn } from "@/lib/utils/cn";

function tone(category: number) {
  if (category <= 2) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (category === 3) return "border-yellow-200 bg-yellow-50 text-yellow-950";
  if (category === 4) return "border-orange-200 bg-orange-50 text-orange-950";
  return "border-red-200 bg-red-50 text-red-950";
}

export function OradsRussianCriteriaPanel() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-black text-[var(--clinical-foreground)]">Русские визуальные критерии</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Короткая шпаргалка по признакам O-RADS 1–5. Используйте как подсказку рядом с эхограммой.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ORADS_RUSSIAN_VISUAL_CRITERIA.map((item) => (
          <article key={item.id} className={cn("rounded-xl border p-3", tone(item.category))}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black">{item.title}</p>
              <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-xs font-black">
                O-RADS {item.category}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold">{item.riskLabel}</p>
            <ul className="mt-2 space-y-1 text-xs">
              {item.signs.map((sign) => (
                <li key={sign}>• {sign}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
