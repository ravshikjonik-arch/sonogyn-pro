"use client";

import { CDSS_SHORT_DISCLAIMER } from "@repo/clinical-tools";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

export function ClinicalCdssDisclaimer({ className }: Props) {
  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-[var(--clinical-foreground)]",
        "rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-3 py-2",
        className,
      )}
      data-e2e-clinical-disclaimer
    >
      {CDSS_SHORT_DISCLAIMER}
    </p>
  );
}
