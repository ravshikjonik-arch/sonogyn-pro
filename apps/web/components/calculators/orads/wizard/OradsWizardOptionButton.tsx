"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
  imageSlot?: ReactNode;
};

/** Крупная кнопка шага O-RADS — контраст текста в light/dark обязателен (PWA). */
export function OradsWizardOptionButton({ label, onClick, className, imageSlot }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "clinical-surface w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold leading-snug transition",
        "text-[var(--clinical-foreground)]",
        "hover:border-[var(--clinical-primary)] hover:bg-[var(--clinical-primary-muted)]/35",
        "active:scale-[0.99]",
        "dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-50 dark:hover:bg-slate-800",
        className,
      )}
    >
      {imageSlot ? <div className="mb-3">{imageSlot}</div> : null}
      {label}
    </button>
  );
}
