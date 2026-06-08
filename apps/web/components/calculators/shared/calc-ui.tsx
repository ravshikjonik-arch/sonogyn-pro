"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function CalcStepCard({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-[var(--clinical-card)] p-4 shadow-sm",
        required ? "border-amber-300" : "border-[var(--clinical-border)]",
      )}
    >
      <h3 className="text-sm font-black text-[var(--clinical-foreground)]">
        {title}
        {required ? <span className="ml-2 text-xs font-bold text-amber-700">· заполните</span> : null}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function CalcChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-left text-xs font-bold transition",
        selected
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "clinical-surface hover:border-[var(--clinical-primary)]",
      )}
    >
      {label}
    </button>
  );
}

export function CalcSubLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">{children}</p>;
}
