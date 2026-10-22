"use client";

import type { OradsColorCode } from "@repo/orads-us";
import { cn } from "@/lib/utils/cn";

export function OradsWizardProgressBar({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className="h-full rounded-full bg-[var(--clinical-primary)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const ORADS_RISK_SURFACE: Record<OradsColorCode, string> = {
  slate: "orads-risk orads-risk-slate",
  sky: "orads-risk orads-risk-sky",
  emerald: "orads-risk orads-risk-emerald",
  amber: "orads-risk orads-risk-amber",
  orange: "orads-risk orads-risk-orange",
  red: "orads-risk orads-risk-red",
};

const ORADS_RISK_TEXT: Record<OradsColorCode, string> = {
  slate: "orads-risk-text-slate",
  sky: "orads-risk-text-sky",
  emerald: "orads-risk-text-emerald",
  amber: "orads-risk-text-amber",
  orange: "orads-risk-text-orange",
  red: "orads-risk-text-red",
};

export function oradsColorClasses(token: OradsColorCode): string {
  return ORADS_RISK_SURFACE[token];
}

export function oradsTextColorClasses(token: OradsColorCode): string {
  return ORADS_RISK_TEXT[token];
}
