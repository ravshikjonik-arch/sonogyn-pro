/**
 * O-RADS US v2022 и IOTA — международные протоколы (ACR O-RADS US, IOTA group).
 * Авторские методички — только в SUPPLEMENTARY_READING.
 */

export const ORADS_US_VERSION = "O-RADS US v2022";

/** Библиотека эхограмм O-RADS (учебные и клинические случаи). */
export const ORADS_ECHOGRAMS_LIBRARY_PATH = "/library/orads-echograms";

export function oradsEchogramsLibraryHref(query?: { chapter?: string; page?: string }): string {
  if (!query?.chapter && !query?.page) return ORADS_ECHOGRAMS_LIBRARY_PATH;
  const params = new URLSearchParams();
  if (query.chapter) params.set("chapter", query.chapter);
  if (query.page) params.set("page", query.page);
  const q = params.toString();
  return q ? `${ORADS_ECHOGRAMS_LIBRARY_PATH}?${q}` : ORADS_ECHOGRAMS_LIBRARY_PATH;
}

export const ORADS_US_PRIMARY_SOURCES = [
  "ACR O-RADS Ultrasound Risk Stratification and Management System (v2022)",
  "IOTA terminology and Simple Rules (International Ovarian Tumor Analysis group)",
  "ISUOG — практические рекомендации по УЗИ аднексальных масс",
] as const;

/** Порог солидного компонента / папиллярной проекции по O-RADS US v2022. */
export const ORADS_US_SOLID_COMPONENT_MIN_MM = 3;

export const ORADS_US_MANAGEMENT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "O-RADS 1 — норма / физиология; рутинное наблюдение по клинике.",
  2: "O-RADS 2 — почти наверняка доброкачественное (<1%); наблюдение по размеру и менопаузальному статусу.",
  3: "O-RADS 3 — низкий риск (1–<10%); экспертное УЗИ и/или МРТ, консультация гинеколога.",
  4: "O-RADS 4 — промежуточный риск (10–<50%); МРТ, онкогинеколог по протоколу центра.",
  5: "O-RADS 5 — высокий риск (≥50%); срочная консультация онкогинеколога, стадирование.",
};

/** Клинические «подводные камни» при применении O-RADS US / IOTA (не заменяют официальную таблицу). */
export const ORADS_US_PITFALL_BULLETS = [
  "Неполная перегородка при смене плоскости → переклассифицировать как однокамерное (O-RADS US).",
  "Солидный компонент по O-RADS US: высота ≥3 мм; ≥4 папиллярных проекций — критерий высокого риска.",
  "Многокамерное с солидным: полная перегородка + солид ≥3 мм — отдельная ветка таблицы.",
  "Солидное образование: >80% тканевой эхогенности в перпендикулярных плоскостях.",
  "Цветовой балл васкуляризации IOTA 1–4; балл 4 — M5 в Simple Rules.",
  "Несколько образований — тактика по наивысшему O-RADS.",
] as const;

export type SupplementaryReadingItem = {
  id: string;
  citation: string;
  note: string;
  href?: string;
};

/** Дополнительная литература — для углубления, не для замены ACR/IOTA. */
export const SUPPLEMENTARY_READING: SupplementaryReadingItem[] = [
  {
    id: "orads-echograms",
    citation:
      "Озерская И.А. Стандартизация ультразвукового исследования патологии придатков матки по IOTA, O-RADS. Методические рекомендации, ч. 1.",
    note: "Русскоязычные эхограммы и разбор типичных ошибок — сверяйте с актуальной версией O-RADS US.",
    href: ORADS_ECHOGRAMS_LIBRARY_PATH,
  },
];

export function oradsManagementForCategory(category: 1 | 2 | 3 | 4 | 5): string {
  return ORADS_US_MANAGEMENT[category];
}

export function buildSupplementaryReadingBlock(): string {
  const lines = SUPPLEMENTARY_READING.map((r) => `• ${r.citation} — ${r.note}`);
  return ["Дополнительная литература (не заменяет ACR O-RADS US / IOTA):", ...lines].join("\n");
}
