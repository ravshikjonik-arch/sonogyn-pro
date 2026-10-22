"use client";

import { CalcChip, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import type { Localization, OvarySide } from "@/lib/orads-pro";

const SIDE_OPTS: { value: OvarySide; label: string }[] = [
  { value: "right", label: "Справа" },
  { value: "left", label: "Слева" },
  { value: "bilateral", label: "С обеих сторон" },
];

type Props = {
  localization?: Localization;
  value?: OvarySide;
  onChange: (side: OvarySide | undefined) => void;
};

export function OradsOvarySideField({ localization, value, onChange }: Props) {
  if (localization === "extraovarian") return null;

  return (
    <div className="space-y-2">
      <CalcSubLabel>Сторона (для протокола)</CalcSubLabel>
      <div className="flex flex-wrap gap-2">
        {SIDE_OPTS.map((o) => (
          <CalcChip
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onClick={() => onChange(value === o.value ? undefined : o.value)}
          />
        ))}
      </div>
    </div>
  );
}
