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

/** Округление линейного измерения до 0.1 мм (клинический стандарт УЗИ). */
export function roundMeasurementMm(mm: number): number {
  if (!Number.isFinite(mm)) return NaN;
  return Math.round(mm * 10) / 10;
}

/** Число для отображения: всегда одна десятая (22.2). */
export function formatMeasurementDecimal(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return roundMeasurementMm(value).toFixed(1);
}

/** Строка с единицей: «22.2 мм» или «2.2 см». */
export function formatMm(mm: number, displayUnit: LengthUnit = "mm"): string {
  if (!Number.isFinite(mm)) return "—";
  if (displayUnit === "cm") return `${roundMeasurementMm(mm / 10).toFixed(1)} см`;
  return `${formatMeasurementDecimal(mm)} мм`;
}

/** Парсинг ввода мм с округлением до 0.1. */
export function parseMeasurementMm(raw: string): number | undefined {
  const n = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(n)) return undefined;
  return roundMeasurementMm(n);
}

/** Display only: «44,2» (decimal comma, always 0.1 mm). Input fields keep formatMeasurementDecimal. */
export function formatMeasurementRu(mm: number): string {
  if (!Number.isFinite(mm)) return "—";
  return roundMeasurementMm(mm).toFixed(1).replace(".", ",");
}

/** Display only: «44,2 мм». */
export function formatMmRu(mm: number): string {
  return `${formatMeasurementRu(mm)} мм`;
}

function isMeasured(v: number | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

/** True only when all three dimensions are positive numbers. */
export function hasThreeDimensions(a?: number, b?: number, c?: number): boolean {
  return isMeasured(a) && isMeasured(b) && isMeasured(c);
}

/** Display only: «44,2×39,4×42,9 мм»; null unless all three dimensions are measured. */
export function formatDimensionsMmRu(a?: number, b?: number, c?: number): string | null {
  if (!hasThreeDimensions(a, b, c)) return null;
  return `${formatMeasurementRu(a!)}×${formatMeasurementRu(b!)}×${formatMeasurementRu(c!)} мм`;
}
