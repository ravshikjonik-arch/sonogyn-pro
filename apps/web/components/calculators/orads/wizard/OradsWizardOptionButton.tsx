"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function OradsWizardOptionButton({ label, onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 border-[var(--clinical-border)] bg-white px-4 py-3.5 text-left text-sm font-bold text-[var(--clinical-foreground)] transition hover:border-[var(--clinical-primary)] hover:bg-[var(--clinical-primary-muted)]/40 active:scale-[0.99]",
        className,
      )}
    >
      {label}
    </button>
  );
}
