"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
  /** Вторичная опция (например «повторить УЗИ») — визуально слабее основной */
  variant?: "default" | "secondary";
};

export function OradsWizardOptionButton({
  label,
  onClick,
  className,
  variant = "default",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition active:scale-[0.99]",
        variant === "default"
          ? "border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground)] hover:border-[var(--clinical-primary)] hover:bg-[var(--clinical-primary-muted)]/40"
          : "border-[var(--clinical-border)] bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)] hover:border-slate-400 hover:bg-[var(--clinical-surface-muted)] dark:hover:border-slate-500",
        className,
      )}
    >
      {label}
    </button>
  );
}
