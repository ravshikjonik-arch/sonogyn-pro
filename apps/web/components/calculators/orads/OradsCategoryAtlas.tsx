"use client";

import { useState } from "react";

import {
  ORADS_CATEGORY_CHAPTERS,
  chapterToneClasses,
  type OradsCategoryId,
} from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

export function OradsCategoryAtlas({ initialTab }: { initialTab?: OradsCategoryId }) {
  const [tab, setTab] = useState<OradsCategoryId>(initialTab ?? 1);
  const chapter = ORADS_CATEGORY_CHAPTERS.find((c) => c.id === tab)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {ORADS_CATEGORY_CHAPTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setTab(c.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              tab === c.id
                ? "bg-[var(--clinical-primary)] text-white"
                : "clinical-surface text-[var(--clinical-primary-deep)]",
            )}
          >
            {c.id}
          </button>
        ))}
      </div>

      <div className={cn("rounded-2xl border-2 p-4", chapterToneClasses(chapter.tone))}>
        <h3 className="text-lg font-black">{chapter.titleRu}</h3>
        <p className="text-sm font-semibold">{chapter.subtitleRu}</p>
        <p className="mt-2 text-xs">{chapter.riskSummary}</p>
        <p className="mt-1 text-xs font-bold">Тактика: {chapter.managementRu}</p>
      </div>

      <div className="space-y-3">
        {chapter.lesions.map((lesion) => (
          <article
            key={lesion.id}
            className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-[var(--clinical-primary-deep)]">{lesion.nameRu}</h4>
              <span
                className="shrink-0 rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-primary-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--clinical-primary-deep)]"
                title="Схема / пример УЗИ — в протоколе центра"
              >
                УЗИ
              </span>
            </div>
            {lesion.sizeNote ? <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{lesion.sizeNote}</p> : null}
            <ul className="mt-2 list-inside list-disc text-xs leading-relaxed">
              {lesion.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {lesion.riskNote ? <p className="mt-2 text-xs font-semibold text-amber-800">{lesion.riskNote}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
