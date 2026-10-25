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
    pointsRange: "0 баллов",
    definitionRu: "Нет узла, киста без других баллов или spongiform.",
    malignancyRisk: "≈0%",
    riskLevel: "none",
    clinicalSignificance: "FNA не показана. УЗИ-наблюдение по ACR не требуется.",
    educationRu: "TR1 — 0 баллов. Spongiform не дополняют другими признаками.",
  },
  {
    code: "TR2",
    label: "TR2 · Not Suspicious",
    pointsRange: "1–2 балла",
    definitionRu: "Неподозрительный узел.",
    malignancyRisk: "<2%",
    riskLevel: "very_low",
    clinicalSignificance: "FNA не показана. УЗИ-наблюдение по ACR не требуется.",
    educationRu: "TR2 — 2 балла по таблице ACR. 1 балл (только смешанный состав) тоже TR2.",
  },
  {
    code: "TR3",
    label: "TR3 · Mildly Suspicious",
    pointsRange: "3 балла",
    definitionRu: "Слабо подозрительный узел.",
    malignancyRisk: "~5%",
    riskLevel: "low",
    clinicalSignificance: "FNA ≥2,5 см. Наблюдение ≥1,5 см: УЗИ через 1, 3 и 5 лет.",
    educationRu: "TR3 — ровно 3 балла. 4 балла уже TR4.",
  },
  {
    code: "TR4",
    label: "TR4 · Moderately Suspicious",
    pointsRange: "4–6 баллов",
    definitionRu: "Умеренно подозрительный узел.",
    malignancyRisk: "5–20%",
    riskLevel: "intermediate",
    clinicalSignificance: "FNA ≥1,5 см. Наблюдение ≥1,0 см: УЗИ через 1, 2, 3 и 5 лет.",
    educationRu: "TR4 — часто гипоэхогенный солидный узел с частичными признаками.",
  },
  {
    code: "TR5",
    label: "TR5 · Highly Suspicious",
    pointsRange: "≥7 баллов",
    definitionRu: "Высокоподозрительный узел.",
    malignancyRisk: ">20%",
    riskLevel: "high",
    clinicalSignificance: "FNA ≥1,0 см. Наблюдение ≥0,5 см: УЗИ ежегодно до 5 лет.",
    educationRu: "TR5 — taller-than-wide, very hypoechoic, punctate foci, irregular margin.",
  },
];

export function categoryMeta(code: TiradsAcrCategory): TiradsCategoryMeta {
  return TIRADS_CATEGORIES.find((c) => c.code === code) ?? TIRADS_CATEGORIES[0]!;
}
