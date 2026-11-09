import type {
  EuComposition,
  EuEchogenicity,
  EuExtrathyroidalExtension,
  EuLymphNodes,
  EuMargins,
  EuMicrocalcifications,
  EuShape,
  EuTiradsCategory,
} from "./types";

export type EuOption<T extends string> = { value: T; labelRu: string; hintRu?: string };

export const EU_COMPOSITION_OPTIONS: EuOption<EuComposition>[] = [
  { value: "no_nodule", labelRu: "Узлов нет" },
  { value: "pure_cyst", labelRu: "Чистая (простая) киста", hintRu: "Анэхогенное содержимое без солидного компонента." },
  { value: "entirely_spongiform", labelRu: "Полностью губчатый узел", hintRu: "Весь узел из мелких кистозных пространств." },
  { value: "mixed", labelRu: "Смешанный (кистозно-солидный)", hintRu: "Оценивайте эхогенность солидного компонента." },
  { value: "solid", labelRu: "Солидный / почти солидный" },
];

export const EU_ECHOGENICITY_OPTIONS: EuOption<EuEchogenicity>[] = [
  { value: "hyperechoic", labelRu: "Гиперэхогенный" },
  { value: "isoechoic", labelRu: "Изоэхогенный" },
  { value: "mildly_hypoechoic", labelRu: "Умеренно гипоэхогенный", hintRu: "Ниже паренхимы, но выше мышц шеи." },
  { value: "markedly_hypoechoic", labelRu: "Выраженно гипоэхогенный", hintRu: "Ниже прилежащих мышц шеи." },
];

export const EU_SHAPE_OPTIONS: EuOption<EuShape>[] = [
  { value: "oval", labelRu: "Овальная" },
  { value: "non_oval", labelRu: "Неовальная / неправильная", hintRu: "В т.ч. «выше, чем шире» в поперечном срезе." },
];

export const EU_MARGINS_OPTIONS: EuOption<EuMargins>[] = [
  { value: "smooth", labelRu: "Ровные" },
  { value: "ill_defined", labelRu: "Нечёткие", hintRu: "Размытые, но не неровные — не признак высокого риска." },
  { value: "irregular", labelRu: "Неровные", hintRu: "Спикулы, микродольчатость." },
];

export const EU_MICROCALCIFICATIONS_OPTIONS: EuOption<EuMicrocalcifications>[] = [
  { value: "absent", labelRu: "Микрокальцинатов нет" },
  { value: "present", labelRu: "Микрокальцинаты есть" },
];

export const EU_ETE_OPTIONS: EuOption<EuExtrathyroidalExtension>[] = [
  { value: "none", labelRu: "Нет признаков" },
  { value: "suspected", labelRu: "Подозрение на экстратиреоидное распространение" },
  { value: "definite", labelRu: "Явное экстратиреоидное распространение" },
];

export const EU_LYMPH_NODE_OPTIONS: EuOption<EuLymphNodes>[] = [
  { value: "not_assessed", labelRu: "Не оценивались" },
  { value: "normal", labelRu: "Без особенностей" },
  { value: "indeterminate", labelRu: "Неопределённые" },
  { value: "suspicious", labelRu: "Подозрительные" },
];

export const EU_CATEGORY_META: Record<EuTiradsCategory, { labelRu: string; malignancyRiskRu: string }> = {
  1: { labelRu: "EU-TIRADS 1 · норма (узлов нет)", malignancyRiskRu: "нет" },
  2: { labelRu: "EU-TIRADS 2 · доброкачественный", malignancyRiskRu: "≈0%" },
  3: { labelRu: "EU-TIRADS 3 · низкий риск", malignancyRiskRu: "2–4%" },
  4: { labelRu: "EU-TIRADS 4 · промежуточный риск", malignancyRiskRu: "6–17%" },
  5: { labelRu: "EU-TIRADS 5 · высокий риск", malignancyRiskRu: "26–87%" },
};
