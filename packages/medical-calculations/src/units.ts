/** Biometry linear dimensions are stored internally in millimetres (mm). */

export type LengthUnit = "mm" | "cm";

export function toMillimetres(value: number, unit: LengthUnit): number {
  if (!Number.isFinite(value) || value <= 0) return NaN;
  return unit === "cm" ? value * 10 : value;
}

export function fromMillimetres(mm: number, unit: LengthUnit): number {
  if (!Number.isFinite(mm)) return NaN;
  return unit === "cm" ? mm / 10 : mm;
}

export function formatMm(mm: number, displayUnit: LengthUnit = "mm"): string {
  if (!Number.isFinite(mm)) return "—";
  if (displayUnit === "cm") return `${(mm / 10).toFixed(1)} см`;
  return `${Math.round(mm)} мм`;
}
