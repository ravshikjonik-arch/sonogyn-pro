"use client";

import type { LexiconFeature } from "@/lib/ai/imaging-cds/lexicon-schemas";
import { cn } from "@/lib/utils/cn";

type Props = {
  imageUrl: string;
  imageAlt: string;
  features: LexiconFeature[];
  className?: string;
};

const REGION_COLORS = [
  "border-emerald-400/90 bg-emerald-400/15",
  "border-sky-400/90 bg-sky-400/15",
  "border-amber-400/90 bg-amber-400/15",
  "border-rose-400/90 bg-rose-400/15",
];

/** Assistive bbox overlay for lexicon features (normalized 0–1 regions). */
export function LexiconImageOverlay({ imageUrl, imageAlt, features, className }: Props) {
  const withRegion = features.filter((f) => f.region && !f.notAssessableOnFrame);
  if (!withRegion.length) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt}
        className={cn("mx-auto max-h-44 object-contain", className)}
      />
    );
  }

  return (
    <div className={cn("relative mx-auto max-w-full", className)}>
      <img src={imageUrl} alt={imageAlt} className="mx-auto max-h-44 w-full object-contain" />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {withRegion.map((f, i) => {
          const r = f.region!;
          return (
            <div
              key={`${f.id}-${i}`}
              className={cn(
                "absolute rounded-sm border-2",
                REGION_COLORS[i % REGION_COLORS.length],
              )}
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
              }}
              title={f.labelRu}
            />
          );
        })}
      </div>
      <p className="mt-1 text-center text-[10px] text-[var(--clinical-foreground-muted)]">
        Рамки — assistive ROI (не сегментация); подтверждение врачом.
      </p>
    </div>
  );
}
