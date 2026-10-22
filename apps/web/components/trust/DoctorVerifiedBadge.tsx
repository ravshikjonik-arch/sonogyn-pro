import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Подтверждённый врач (диплом прошёл модерацию). */
export function DoctorVerifiedBadge({ className, compact }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--accent-soft-border,var(--clinical-primary-muted))] bg-[var(--accent-soft,var(--clinical-primary-muted))] font-semibold text-[var(--clinical-primary-deep)]",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      title="Статус врача подтверждён модерацией"
    >
      <BadgeCheck className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      {compact ? "✓" : "Врач ✓"}
    </span>
  );
}
