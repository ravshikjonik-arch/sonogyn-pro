"use client";

import type { AdnexAssessmentContext } from "@repo/orads-us/pregnancy";
import { PREGNANCY_ADNEXAL_MODE_TITLE_RU } from "@repo/orads-us/pregnancy";

import { cn } from "@/lib/utils/cn";

type Props = {
  value: AdnexAssessmentContext;
  onChange: (next: AdnexAssessmentContext) => void;
  className?: string;
};

/** Переключатель: небеременная (O-RADS) ↔ беременность (отдельный режим). */
export function OradsAssessmentContextSwitch({ value, onChange, className }: Props) {
  return (
    <fieldset
      className={cn(
        "rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3",
        className,
      )}
      data-e2e-orads-assessment-context
    >
      <legend className="px-1 text-sm font-semibold text-[var(--clinical-foreground)]">
        Клинический сценарий
      </legend>
      <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
        При беременности категории O-RADS не присваиваются.
      </p>
      <div
        className="mt-3 grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Сценарий оценки придатков"
      >
        {(
          [
            {
              id: "non_pregnant" as const,
              label: "Не беременна",
              hint: "ACR O-RADS US v2022 · категории 0–5",
            },
            {
              id: "pregnant" as const,
              label: "Беременность",
              hint: PREGNANCY_ADNEXAL_MODE_TITLE_RU,
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            data-e2e-orads-context={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
              value === opt.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/10 font-semibold ring-1 ring-[var(--clinical-primary)]/30"
                : "border-[var(--clinical-border)] hover:border-[var(--clinical-primary)]/40",
            )}
          >
            <span className="block text-sm text-[var(--clinical-foreground)]">{opt.label}</span>
            <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">
              {opt.hint}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
