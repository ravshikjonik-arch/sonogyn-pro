"use client";

import { useState } from "react";
import { formatMeasurementRu, parseMeasurementMm } from "@repo/medical-calculations";

import { Input } from "@/components/ui/input";

type Props = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
};

/** Millimetre field: accepts «44,2» while typing (type="number" drops the comma), shows «44,2» after blur. */
export function DecimalMmInput({ value, onChange, ariaLabel, placeholder = "0,0", className }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (typeof value === "number" && Number.isFinite(value) && value > 0 ? formatMeasurementRu(value) : "");
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={shown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        onChange(raw.trim() === "" ? undefined : parseMeasurementMm(raw));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
