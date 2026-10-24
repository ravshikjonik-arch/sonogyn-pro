"use client";

import type { OnboardingCharacterId } from "@repo/types";

import { cn } from "@/lib/utils/cn";

const OPTIONS: { id: OnboardingCharacterId; label: string }[] = [
  { id: "boy", label: "Мужчина" },
  { id: "girl", label: "Женщина" },
];

type Props = {
  value: OnboardingCharacterId | null;
  onChange: (id: OnboardingCharacterId) => void;
  /** Короткая подпись под переключателем */
  hint?: string;
};

export function AuthGenderPicker({ value, onChange, hint }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Мужчина или женщина">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-2xl border-2 px-4 py-4 text-center text-base font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
                selected
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-bg)] text-[var(--clinical-foreground)] hover:border-[var(--clinical-primary-deep)]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{hint}</p> : null}
    </div>
  );
}
