/** Акушерство / гинекология / УЗД — фильтр мониторинга приказов (title + snippet). */
export const RF_REGULATION_RELEVANCE_KEYWORDS = [
  "акушер",
  "гинекол",
  "узи",
  "ультразвук",
  "беремен",
  "шейк",
  "матк",
  "яичник",
  "молочн",
  "мамм",
  "пренатал",
  "плод",
  "эндометри",
  "миом",
  "скрининг",
  "фетом",
  "допплер",
  "орads",
  "o-rads",
  "bi-rads",
  "исуог",
  "isuog",
  "клиническ рекоменд",
  "кр ",
] as const;

export function isRfRegulationRelevant(title: string, snippet: string, alwaysInclude = false): boolean {
  if (alwaysInclude) return true;
  const hay = `${title} ${snippet}`.toLowerCase();
  return RF_REGULATION_RELEVANCE_KEYWORDS.some((k) => hay.includes(k));
}
