/** Парсинг числа с запятой/точкой (22,3 → 22.3). */
export function parseDecimal(v: string): number | undefined {
  const normalized = v.trim().replace(",", ".");
  if (!normalized) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

/** Формат мм для полей ввода (до 1 знака после запятой). */
export function formatMmValue(n?: number): string {
  if (n == null || !Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}
