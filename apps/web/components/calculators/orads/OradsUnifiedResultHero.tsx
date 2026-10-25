"use client";

import type { OradsUs2022Result } from "@repo/orads-us/pro";
import { cdssOradsCategoryBandLabel, CDSS_SHORT_DISCLAIMER } from "@repo/clinical-tools";
import { chapterToneClasses } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

function categoryTone(category: number | null): string {
  if (category === null) return "border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/25";
  const toneByCategory = {
    0: "slate",
    1: "sky",
    2: "emerald",
    3: "amber",
    4: "orange",
    5: "red",
  } as const;
  if (category in toneByCategory) {
    return chapterToneClasses(toneByCategory[category as keyof typeof toneByCategory]);
  }
  return "border-[var(--clinical-border)] bg-[var(--clinical-card)]";
}

type Props = {
  result: OradsUs2022Result;
  className?: string;
};

/** Единственный акцент экрана — категория O-RADS и ROM (клинический «герой»). */
export function OradsUnifiedResultHero({ result, className }: Props) {
  const cat = result.category;

  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 p-5 shadow-none",
        categoryTone(cat),
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {cat === null ? (
        <>
          <p className="text-sm font-medium text-[var(--clinical-foreground-muted)]">Категория</p>
          <p className="mt-1 text-lg font-semibold leading-snug text-[var(--clinical-foreground)]">
            {result.title}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--clinical-foreground-muted)]">O-RADS US v2022</p>
          <p
            className="mt-1 font-semibold tabular-nums tracking-tight text-[var(--clinical-foreground)] text-5xl leading-none"
            data-e2e-orads-category={cat}
          >
            {cat}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--clinical-foreground)]">
            {cdssOradsCategoryBandLabel(cat)}
          </p>
          <p className="mt-2 text-sm font-medium">
            <span className="text-[var(--clinical-foreground-muted)]">ROM: </span>
            {result.risk}
          </p>
        </>
      )}

      <div className="mt-4 space-y-2 border-t border-[var(--clinical-border)]/60 pt-4 text-sm leading-relaxed text-[var(--clinical-foreground)]">
        <p>{result.rationale}</p>
        <p className="whitespace-pre-line font-medium">{result.management}</p>
      </div>

      {result.missing.length ? (
        <ul className="mt-3 space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
          {result.missing.map((m) => (
            <li key={m}>— {m}</li>
          ))}
        </ul>
      ) : null}

      {result.warning ? (
        <p className="mt-3 rounded-lg border border-amber-500/35 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed dark:bg-amber-950/40">
          {result.warning}
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-[var(--clinical-foreground)]" data-e2e-clinical-disclaimer>
        {CDSS_SHORT_DISCLAIMER}
      </p>
    </div>
  );
}
