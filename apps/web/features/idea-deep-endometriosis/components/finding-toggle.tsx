"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";

export type FindingToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
};

export function FindingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
  testId,
}: FindingToggleProps) {
  return (
    <div
      className={cn(
        "flex min-h-[44px] items-center justify-between gap-4 rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2",
        className,
      )}
      data-testid={testId}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {description ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </div>
  );
}
