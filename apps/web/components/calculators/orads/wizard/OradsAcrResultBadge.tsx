"use client";

import type { OradsTreeResult } from "@repo/orads-us";
import { cn } from "@/lib/utils/cn";
import { oradsColorClasses, oradsTextColorClasses } from "@/components/calculators/orads/wizard/OradsWizardUi";

type Props = {
  result: OradsTreeResult;
  romLabel: string;
  className?: string;
};

/** Круглый бейдж результата в духе ACR O-RADS App. */
export function OradsAcrResultBadge({ result, romLabel, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-4 text-center", className)}>
      <div
        className={cn(
          "flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 shadow-md",
          oradsColorClasses(result.colorCode),
        )}
      >
        <span
          className={cn("text-4xl font-bold tabular-nums leading-none", oradsTextColorClasses(result.colorCode))}
          data-e2e-orads-category={result.categoryNumber}
        >
          {result.categoryNumber}
        </span>
        <span className={cn("mt-1 px-2 text-[10px] font-semibold leading-tight", oradsTextColorClasses(result.colorCode))}>
          O-RADS
        </span>
      </div>
      <p className={cn("max-w-md text-base font-semibold leading-snug", oradsTextColorClasses(result.colorCode))}>
        {result.category}
      </p>
      <p className="text-sm font-medium text-[var(--clinical-foreground-muted)]">
        {romLabel}: {result.riskPercent}
      </p>
    </div>
  );
}
