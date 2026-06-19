export function isYooKassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim());
}

export function readYooKassaProPriceRub(): number {
  const raw = process.env.YOOKASSA_PRO_PRICE_RUB?.trim() ?? "990";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 990;
}
