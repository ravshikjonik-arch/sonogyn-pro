"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { IdeaStepIndex } from "../lib/schema";

export type StepperStep = {
  index: IdeaStepIndex;
  label: string;
  complete: boolean;
  error: boolean;
};

export type IdeaStepperProps = {
  steps: StepperStep[];
  active: IdeaStepIndex;
  onSelect: (step: IdeaStepIndex) => void;
  className?: string;
  testId?: string;
};

export function IdeaStepper({ steps, active, onSelect, className, testId }: IdeaStepperProps) {
  return (
    <nav aria-label="IDEA workflow steps" className={cn("w-full", className)} data-testid={testId}>
      <ol className="flex flex-wrap items-center gap-2 md:gap-3">
        {steps.map((s) => {
          const isActive = s.index === active;
          return (
            <li key={s.index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(s.index)}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold transition-all",
                  isActive && "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]",
                  !isActive && !s.error && !s.complete && "border-[var(--clinical-border)] bg-white text-slate-700",
                  s.complete && !s.error && "border-emerald-500/60 bg-emerald-50 text-emerald-900",
                  s.error && "border-red-500 ring-2 ring-red-200",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    s.complete && !s.error && "bg-emerald-600 text-white",
                    s.error && "bg-red-600 text-white",
                    !s.complete && !s.error && "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
                  )}
                  aria-hidden
                >
                  {s.complete && !s.error ? <Check className="h-4 w-4" /> : s.index + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
