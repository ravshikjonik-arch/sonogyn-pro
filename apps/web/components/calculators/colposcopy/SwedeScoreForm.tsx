"use client";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { SWEDE_CRITERIA, type SwedeCriterionKey, type SwedeScoreInput, type SwedeScoreLevel } from "@/lib/colposcopy";

type Props = {
  value: SwedeScoreInput;
  onChange: (key: SwedeCriterionKey, level: SwedeScoreLevel) => void;
};

export function SwedeScoreForm({ value, onChange }: Props) {
  return (
    <CalcStepCard title="Swede Score · 5 признаков (IFCPC 2011)">
      <div className="space-y-3">
        {SWEDE_CRITERIA.map((criterion, idx) => (
          <div
            key={criterion.key}
            className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-3"
          >
            <p className="text-sm font-bold text-[var(--clinical-foreground)]">
              {idx + 1}. {criterion.title}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {criterion.options.map((opt) => (
                <CalcChip
                  key={opt.value}
                  label={`${opt.label} (${opt.short})`}
                  selected={value[criterion.key] === opt.value}
                  onClick={() => onChange(criterion.key, opt.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CalcStepCard>
  );
}
