"use client";

import { classifyJzThickness, MUSA_ADENOMYOSIS_KNOWLEDGE } from "@repo/musa-framework";

import { Input } from "@/components/ui/input";
import { MusaCard } from "@/components/musa/MusaCard";

type JunctionalZoneCardProps = {
  thicknessMm: string;
  onThicknessChange: (value: string) => void;
  irregularity: "JZ-I" | "JZ-II" | "JZ-III" | "";
  onIrregularityChange: (value: "JZ-I" | "JZ-II" | "JZ-III" | "") => void;
};

export function JunctionalZoneCard({
  thicknessMm,
  onThicknessChange,
  irregularity,
  onIrregularityChange,
}: JunctionalZoneCardProps) {
  const mm = thicknessMm.trim() ? Number.parseFloat(thicknessMm) : null;
  const jzClass = classifyJzThickness(mm);
  const band = MUSA_ADENOMYOSIS_KNOWLEDGE.junctionalZone.classification.find((c) => c.class === jzClass);

  return (
    <MusaCard title="Junctional Zone (JZ)" description={MUSA_ADENOMYOSIS_KNOWLEDGE.junctionalZone.sonogynTip}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="jz-mm" className="mb-1 block text-sm font-medium">
            Толщина JZ (мм)
          </label>
          <Input
            id="jz-mm"
            inputMode="decimal"
            value={thicknessMm}
            onChange={(e) => onThicknessChange(e.target.value)}
            placeholder="≤ 8 норма"
          />
        </div>
        <div>
          <label htmlFor="jz-irr" className="mb-1 block text-sm font-medium">
            Неровность JZ
          </label>
          <select
            id="jz-irr"
            className="flex h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
            value={irregularity}
            onChange={(e) => onIrregularityChange(e.target.value as JunctionalZoneCardProps["irregularity"])}
          >
            <option value="">—</option>
            {MUSA_ADENOMYOSIS_KNOWLEDGE.junctionalZone.irregularity.map((i) => (
              <option key={i.class} value={i.class}>
                {i.class}: {i.description}
              </option>
            ))}
          </select>
        </div>
      </div>
      {band ? (
        <div className="mt-4 rounded-xl border border-[var(--clinical-border)] p-3 text-sm">
          <p className="font-semibold">
            {band.class} — {band.description}
          </p>
          <p className="mt-1 text-[var(--clinical-foreground-muted)]">{band.reportingText}</p>
          {mm != null && mm > 12 ? (
            <p className="mt-2 text-[var(--clinical-primary)]">Sonogyn Score: +2 (JZ &gt; 12 мм)</p>
          ) : null}
        </div>
      ) : null}
    </MusaCard>
  );
}
