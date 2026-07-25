/** BI-RADS US категории — ACR Atlas 5th Ed + учебный протокол SonoGyn. */

export type BiradsCategoryCode = "0" | "1" | "2" | "3" | "4A" | "4B" | "4C" | "5" | "6";

export type BiradsCategoryMeta = {
  code: BiradsCategoryCode;
  label: string;
  definitionRu: string;
  malignancyRisk: string;
  suspicionLevel: "none" | "low" | "probably_benign" | "low_suspicion" | "intermediate" | "high" | "very_high" | "proven";
  followUpRu: string;
  managementRu: string;
  biopsyRecommended: boolean;
};

export const BIRADS_CATEGORIES: BiradsCategoryMeta[] = [
  {
    code: "0",
    label: "BI-RADS 0",
    definitionRu: "Недостаточно данных для окончательной категории.",
    malignancyRisk: "не оценивается",
    suspicionLevel: "none",
    followUpRu: "Дополнительная визуализация, сравнение с предыдущими исследованиями.",
    managementRu: "Повтор УЗИ/ММГ, дообследование до присвоения финальной категории.",
    biopsyRecommended: false,
  },
  {
    code: "1",
    label: "BI-RADS 1",
    definitionRu: "Отрицательное исследование — патологических находок нет.",
    malignancyRisk: "0%",
    suspicionLevel: "none",
    followUpRu: "Рутинный скрининг по возрасту и протоколу.",
    managementRu: "Стандартное наблюдение.",
    biopsyRecommended: false,
  },
  {
    code: "2",
    label: "BI-RADS 2",
    definitionRu: "Доброкачественные находки с типичной картиной.",
    malignancyRisk: "0%",
    suspicionLevel: "low",
    followUpRu: "Рутинный скрининг.",
    managementRu: "Без биопсии при типичной картине (простая киста, липома, интрамаммарный ЛУ и др.).",
    biopsyRecommended: false,
  },
  {
    code: "3",
    label: "BI-RADS 3",
    definitionRu: "Вероятно доброкачественное образование.",
    malignancyRisk: "≤2%",
    suspicionLevel: "probably_benign",
    followUpRu: "Короткий интервал наблюдения (часто 6 мес.) или продолжение до 12 мес.",
    managementRu: "Биопсия не обязательна при типичной картине; контроль динамики.",
    biopsyRecommended: false,
  },
  {
    code: "4A",
    label: "BI-RADS 4A",
    definitionRu: "Подозрительное образование — низкая степень подозрения.",
    malignancyRisk: ">2% – ≤10%",
    suspicionLevel: "low_suspicion",
    followUpRu: "Морфологическая верификация по показаниям.",
    managementRu: "Биопсия или тесное дообследование по протоколу клиники.",
    biopsyRecommended: true,
  },
  {
    code: "4B",
    label: "BI-RADS 4B",
    definitionRu: "Подозрительное образование — промежуточная степень подозрения.",
    malignancyRisk: ">10% – ≤50%",
    suspicionLevel: "intermediate",
    followUpRu: "Морфологическая верификация.",
    managementRu: "Биопсия рекомендована.",
    biopsyRecommended: true,
  },
  {
    code: "4C",
    label: "BI-RADS 4C",
    definitionRu: "Подозрительное образование — высокая степень подозрения.",
    malignancyRisk: ">50% – <95%",
    suspicionLevel: "high",
    followUpRu: "Срочная морфологическая верификация.",
    managementRu: "Биопсия, онкомаршрут.",
    biopsyRecommended: true,
  },
  {
    code: "5",
    label: "BI-RADS 5",
    definitionRu: "Высокая вероятность злокачественности по визуальным признакам.",
    malignancyRisk: ">95%",
    suspicionLevel: "very_high",
    followUpRu: "Срочная биопсия и онкологическое ведение.",
    managementRu: "Биопсия, staging, мультидисциплинарный маршрут.",
    biopsyRecommended: true,
  },
  {
    code: "6",
    label: "BI-RADS 6",
    definitionRu: "Известная злокачественность, подтверждённая гистологически.",
    malignancyRisk: "100% (верифицирована)",
    suspicionLevel: "proven",
    followUpRu: "Наблюдение и лечение по онкопротоколу.",
    managementRu: "Хирург/онколог, не менять категорию до завершения лечения.",
    biopsyRecommended: false,
  },
];

export function categoryMeta(code: BiradsCategoryCode): BiradsCategoryMeta {
  return BIRADS_CATEGORIES.find((c) => c.code === code) ?? BIRADS_CATEGORIES[0]!;
}

export function parseCategoryCode(category: string): BiradsCategoryCode | null {
  const m = category.match(/BI-RADS\s*(0|1|2|3|4A|4B|4C|5|6)/i);
  if (!m) return null;
  return m[1]!.toUpperCase() as BiradsCategoryCode;
}
