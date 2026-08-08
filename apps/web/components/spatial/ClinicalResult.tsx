import type { ReactNode } from "react";

import { SpatialCard } from "@/components/spatial/SpatialCard";
import { cn } from "@/lib/utils/cn";

type ClinicalResultProps = {
  label: string;
  value: string;
  confidence?: string;
  children?: ReactNode;
  tone?: "standard" | "watch" | "alert";
  className?: string;
};

const toneClass = {
  standard: "border-[var(--clinical-border)]",
  watch: "border-amber-300/80",
  alert: "border-red-300/80",
};

export function ClinicalResult({
  label,
  value,
  confidence,
  children,
  tone = "standard",
  className,
}: ClinicalResultProps) {
  return (
    <SpatialCard depth={2} className={cn("p-4", toneClass[tone], className)}>
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[var(--clinical-foreground)]">{value}</p>
      {confidence ? (
        <p className="mt-1 text-xs font-semibold text-[var(--clinical-foreground-muted)]">{confidence}</p>
      ) : null}
      {children ? <div className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{children}</div> : null}
    </SpatialCard>
  );
}
