"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
  imageSlot?: ReactNode;
  variant?: "default" | "acr";
};

/** Крупная кнопка шага O-RADS — контраст текста в light/dark обязателен (PWA). */
export function OradsWizardOptionButton({ label, onClick, className, imageSlot, variant = "default" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl px-4 py-4 text-sm font-semibold leading-snug transition active:scale-[0.99]",
        variant === "acr"
          ? "border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/60 text-center text-[var(--clinical-link)] hover:bg-[var(--clinical-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
          : cn(
              "clinical-surface border-2 text-left text-[var(--clinical-foreground)]",
              "hover:border-[var(--clinical-primary)] hover:bg-[var(--clinical-primary-muted)]/35",
              "dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-50 dark:hover:bg-slate-800",
            ),
        className,
      )}
    >
      {imageSlot ? <div className="mb-3">{imageSlot}</div> : null}
      {label}
    </button>
  );
}
