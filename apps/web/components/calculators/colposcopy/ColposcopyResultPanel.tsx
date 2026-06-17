"use client";

import { type SwedeScoreResult } from "@/lib/colposcopy";
import { riskBannerClass } from "@/lib/colposcopy/build-document-specs";
import { cn } from "@/lib/utils/cn";

type Props = {
  result: SwedeScoreResult;
  calculated: boolean;
};

export function ColposcopyResultPanel({ result, calculated }: Props) {
  if (!calculated) return null;

  return (
    <div className={cn("space-y-2 rounded-2xl border-2 p-5", riskBannerClass(result.riskLevel))}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Swede Score</p>
      <p className="text-4xl font-black">{result.total} / 10</p>
      <p className="text-lg font-bold">{result.riskLabel}</p>
      <p className="text-sm leading-relaxed">{result.recommendation}</p>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">{result.cinRiskHint}</p>
    </div>
  );
}
