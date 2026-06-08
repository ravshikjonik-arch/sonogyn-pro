/**
 * IOTA Simple Rules (International Ovarian Tumor Analysis).
 * Timmerman et al., Ultrasound Obstet Gynecol 2008; обновление IOTA group 2016.
 * @see https://www.iotagroup.org/
 */

export type IotaFeature = {
  code: string;
  description: string;
  category: "B" | "M";
};

export const IOTA_BENIGN_FEATURES: IotaFeature[] = [
  { code: "B1", description: "Однокамерная киста", category: "B" },
  { code: "B2", description: "Солидный компонент <7 мм", category: "B" },
  { code: "B3", description: "Акустические тени", category: "B" },
  { code: "B4", description: "Гладкая внутренняя стенка", category: "B" },
  { code: "B5", description: "Размер <100 мм", category: "B" },
  {
    code: "B6",
    description: "Отсутствие кровотока при ЦДК (цветовое допплеровское картирование)",
    category: "B",
  },
];

export const IOTA_MALIGNANT_FEATURES: IotaFeature[] = [
  { code: "M1", description: "Неправильная солидная опухоль", category: "M" },
  { code: "M2", description: "Асцит", category: "M" },
  { code: "M3", description: "≥4 папиллярных разрастаний", category: "M" },
  { code: "M4", description: "Неправильное многокамерное образование ≥100 мм", category: "M" },
  { code: "M5", description: "Выраженный кровоток (ЦДК, score 4)", category: "M" },
];

export function applyIotaSimpleRules(benignFeatures: string[], malignantFeatures: string[]): "B" | "M" | "U" {
  if (benignFeatures.length > 0 && malignantFeatures.length === 0) return "B";
  if (malignantFeatures.length > 0 && benignFeatures.length === 0) return "M";
  return "U";
}
