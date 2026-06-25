"use client";

import type { MusaLocalizationCode } from "@repo/musa-framework";
import { MUSA_ADENOMYOSIS_KNOWLEDGE } from "@repo/musa-framework";

import { MusaCard } from "@/components/musa/MusaCard";

const REGION_COLORS: Record<MusaLocalizationCode, string> = {
  AW: "bg-sky-200/80 dark:bg-sky-900/50",
  PW: "bg-violet-200/80 dark:bg-violet-900/50",
  FU: "bg-emerald-200/80 dark:bg-emerald-900/50",
  RL: "bg-amber-200/80 dark:bg-amber-900/50",
  LL: "bg-orange-200/80 dark:bg-orange-900/50",
  CX: "bg-rose-200/80 dark:bg-rose-900/50",
};

type LocalizationMapProps = {
  selected: MusaLocalizationCode[];
  onChange: (next: MusaLocalizationCode[]) => void;
};

export function LocalizationMap({ selected, onChange }: LocalizationMapProps) {
  const toggle = (code: MusaLocalizationCode) => {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  };

  return (
    <MusaCard title="Sonogyn Localization Map" description="MUSA — локализация поражения">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MUSA_ADENOMYOSIS_KNOWLEDGE.localization.regions.map((region) => {
          const active = selected.includes(region.code as MusaLocalizationCode);
          return (
            <button
              key={region.code}
              type="button"
              onClick={() => toggle(region.code as MusaLocalizationCode)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                active
                  ? `${REGION_COLORS[region.code as MusaLocalizationCode]} ring-2 ring-[var(--clinical-primary)]`
                  : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]"
              }`}
            >
              <span className="font-mono text-xs font-bold">{region.code}</span>
              <p className="mt-1 font-medium">{region.labelRu}</p>
            </button>
          );
        })}
      </div>
    </MusaCard>
  );
}
