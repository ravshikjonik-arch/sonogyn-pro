"use client";

import type { LexiconFeature } from "@/lib/ai/imaging-cds/lexicon-schemas";
import { cn } from "@/lib/utils/cn";

type Props = {
  features: LexiconFeature[];
  title?: string;
};

function confidenceTone(c?: number): string {
  if (c === undefined) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  if (c >= 0.75) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  if (c >= 0.45) return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  return "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100";
}

/** Assistive lexicon rows from vision — not final category. */
export function LexiconFeaturesList({ features, title = "Признаки по лексикону (ИИ)" }: Props) {
  if (!features.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[var(--clinical-foreground)]">{title}</p>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li
            key={`${f.id}-${f.labelRu}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-2 py-1.5 text-xs"
          >
            <span className="font-semibold">{f.labelRu}</span>
            <span className="text-[var(--clinical-foreground-muted)]">
              {f.notAssessableOnFrame ? "не оценивается на кадре" : String(f.value)}
            </span>
            {f.confidence !== undefined ? (
              <span
                className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold", confidenceTone(f.confidence))}
                title="Уверенность модели (assistive)"
              >
                {Math.round(f.confidence * 100)}%
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
        Подтвердите или исправьте в wizard / сетке — категорию считает калькулятор ACR.
      </p>
    </div>
  );
}
