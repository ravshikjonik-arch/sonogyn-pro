function measured(v: number | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

/** «22,0» — same display format as @repo/medical-calculations formatMeasurementRu (no extra dependency here). */
export function formatLnMm(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
}

/** Lymph node axes: «22,0×9,0 мм» (long × short); the method uses two axes. */
export function formatLnAxesRu(longAxisMm?: number, shortAxisMm?: number): string {
  if (measured(longAxisMm) && measured(shortAxisMm)) return `${formatLnMm(longAxisMm)}×${formatLnMm(shortAxisMm)} мм`;
  const missing = [measured(longAxisMm) ? null : "длинная ось", measured(shortAxisMm) ? null : "короткая ось"].filter(Boolean);
  return `не указаны полностью (нет: ${missing.join(", ")})`;
}

/** L/S ratio with a decimal comma: «2,44». */
export function formatLnRatio(ratio: number | undefined | null): string {
  return typeof ratio === "number" && Number.isFinite(ratio) ? ratio.toFixed(2).replace(".", ",") : "н/д";
}
