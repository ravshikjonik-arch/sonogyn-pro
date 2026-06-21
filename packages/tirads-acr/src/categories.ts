import type { TiradsAcrCategory } from "./types";

export type TiradsCategoryMeta = {
  code: TiradsAcrCategory;
  label: string;
  pointsRange: string;
  definitionRu: string;
  malignancyRisk: string;
  riskLevel: "none" | "very_low" | "low" | "intermediate" | "high";
  clinicalSignificance: string;
  educationRu: string;
};

export const TIRADS_CATEGORIES: TiradsCategoryMeta[] = [
  {
    code: "TR1",
    label: "TR1 · Benign",
    pointsRange: "нет узла",
    definitionRu: "Нормальная щитовидная железа или отсутствие узла.",
    malignancyRisk: "0%",
    riskLevel: "none",
    clinicalSignificance: "Плановое наблюдение по клинике.",
    educationRu: "TR1 — не применяется к узлам; нет пункции.",
  },
  {
    code: "TR2",
    label: "TR2 · Not Suspicious",
    pointsRange: "0 баллов",
    definitionRu: "Доброкачественный узел (киста, spongiform, comet-tail).",
    malignancyRisk: "<2%",
    riskLevel: "very_low",
    clinicalSignificance: "FNA не показана.",
    educationRu: "TR2 — типично colloid/spongiform/cystic с 0 points.",
  },
  {
    code: "TR3",
    label: "TR3 · Mildly Suspicious",
    pointsRange: "3 балла",
    definitionRu: "Слабо подозрительный узел.",
    malignancyRisk: "~5%",
    riskLevel: "low",
    clinicalSignificance: "FNA ≥2,5 см; наблюдение ≥1,5 см.",
    educationRu: "TR3 — умеренная подозрительность; размер решает тактику.",
  },
  {
    code: "TR4",
    label: "TR4 · Moderately Suspicious",
    pointsRange: "4–6 баллов",
    definitionRu: "Умеренно подозрительный узел.",
    malignancyRisk: "5–20%",
    riskLevel: "intermediate",
    clinicalSignificance: "FNA ≥1,5 см; наблюдение ≥1,0 см.",
    educationRu: "TR4 — часто гипоэхогенный солидный узел с частичными признаками.",
  },
  {
    code: "TR5",
    label: "TR5 · Highly Suspicious",
    pointsRange: "≥7 баллов",
    definitionRu: "Высокоподозрительный узел.",
    malignancyRisk: ">20% (часто >70% при классической картине)",
    riskLevel: "high",
    clinicalSignificance: "FNA ≥1,0 см; наблюдение ≥0,5 см.",
    educationRu: "TR5 — taller-than-wide, very hypoechoic, punctate foci, irregular margin.",
  },
];

export function categoryMeta(code: TiradsAcrCategory): TiradsCategoryMeta {
  return TIRADS_CATEGORIES.find((c) => c.code === code) ?? TIRADS_CATEGORIES[0]!;
}
