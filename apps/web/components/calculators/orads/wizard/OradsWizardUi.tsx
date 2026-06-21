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
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[var(--clinical-primary)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function oradsColorClasses(token: OradsColorCode): string {
  const map: Record<OradsColorCode, string> = {
    slate: "border-slate-400 bg-slate-50",
    sky: "border-sky-400 bg-sky-50",
    emerald: "border-emerald-400 bg-emerald-50",
    amber: "border-amber-400 bg-amber-50",
    orange: "border-orange-500 bg-orange-50",
    red: "border-red-500 bg-red-50",
  };
  return map[token];
}

export function oradsTextColorClasses(token: OradsColorCode): string {
  const map: Record<OradsColorCode, string> = {
    slate: "text-slate-700",
    sky: "text-sky-800",
    emerald: "text-emerald-800",
    amber: "text-amber-900",
    orange: "text-orange-900",
    red: "text-red-800",
  };
  return map[token];
}
