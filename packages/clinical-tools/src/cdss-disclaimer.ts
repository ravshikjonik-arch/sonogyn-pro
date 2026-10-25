/** Единая формулировка для калькуляторов / CDSS (web + mobile). */
export const CDSS_SHORT_DISCLAIMER =
  "Не является диагнозом. Интерпретация — лечащий специалист." as const;

/** Текстовая подпись уровня стратификации (не заменяет ROM; дополняет цвет). */
export function cdssOradsCategoryBandLabel(category: number): string {
  if (category <= 1) return "Низкая категория стратификации (O-RADS)";
  if (category === 2) return "Обычно доброкачественная категория (O-RADS 2)";
  if (category === 3) return "Промежуточная категория (O-RADS 3)";
  if (category === 4) return "Повышенная категория (O-RADS 4)";
  return "Наивысшая категория стратификации (O-RADS 5)";
}
