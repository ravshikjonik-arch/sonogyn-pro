export function isYooKassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim());
}

/** Месяц PRO — источник истины: Vercel `YOOKASSA_PRO_PRICE_RUB` (дефолт 500). */
export function readDefaultProPriceRub(): number {
  const raw = process.env.YOOKASSA_PRO_PRICE_RUB?.trim() ?? "500";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 500;
}

/**
 * Год PRO вперёд — только если задан `YOOKASSA_PRO_YEAR_PRICE_RUB`.
 * Пока не задан — UI показывает «скоро», оплату года не создаём.
 */
export function readProYearPriceRub(): number | null {
  const raw = process.env.YOOKASSA_PRO_YEAR_PRICE_RUB?.trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
