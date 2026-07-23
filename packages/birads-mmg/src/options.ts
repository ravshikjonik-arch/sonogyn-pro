import type { BiradsMmgInput } from "./types.js";

type Opt = { value: string; label: string };

export const BIRADS_MMG_SOURCE =
  "ACR BI-RADS Mammography Atlas (5th Ed.) — образовательный CDS SonoGyn. Итоговая категория — решение врача.";

export const BIRADS_MMG_DISCLAIMER =
  "Не является диагнозом. Дескрипторы и категория — ассистивны; интерпретация и тактика — за специалистом.";

export const mmgOptions = {
  breastComposition: [
    { value: "a", label: "A — почти полностью жировая" },
    { value: "b", label: "B — рассеянные фиброгландулярные зоны" },
    { value: "c", label: "C — гетерогенно плотная" },
    { value: "d", label: "D — крайне плотная" },
  ] as Opt[],
  findingType: [
    { value: "negative", label: "Без патологических находок" },
    { value: "mass", label: "Образование (mass)" },
    { value: "calcifications", label: "Кальцификаты" },
    { value: "asymmetry", label: "Асимметрия" },
    { value: "architectural_distortion", label: "Нарушение архитектоники" },
    { value: "associated_only", label: "Только ассоциированные признаки" },
  ] as Opt[],
  massShape: [
    { value: "oval", label: "Овальная" },
    { value: "round", label: "Округлая" },
    { value: "irregular", label: "Неправильная" },
  ] as Opt[],
  massMargin: [
    { value: "circumscribed", label: "Чёткие (circumscribed)" },
    { value: "obscured", label: "Скрытые (obscured)" },
    { value: "microlobulated", label: "Микродольчатые" },
    { value: "indistinct", label: "Нечёткие (indistinct)" },
    { value: "spiculated", label: "Спикулы" },
  ] as Opt[],
  massDensity: [
    { value: "fat", label: "Жировая (fat-containing)" },
    { value: "low", label: "Низкая (ниже паренхимы)" },
    { value: "equal", label: "Равная паренхиме" },
    { value: "high", label: "Высокая (выше паренхимы)" },
  ] as Opt[],
  calcMorphology: [
    { value: "typically_benign", label: "Типично доброкачественные" },
    { value: "amorphous", label: "Аморфные" },
    { value: "coarse_heterogeneous", label: "Грубые гетерогенные" },
    { value: "fine_pleomorphic", label: "Мелкие плеоморфные" },
    { value: "fine_linear", label: "Мелкие линейные / ветвящиеся" },
  ] as Opt[],
  calcDistribution: [
    { value: "diffuse", label: "Диффузное" },
    { value: "regional", label: "Регионарное" },
    { value: "grouped", label: "Групповое (clustered)" },
    { value: "linear", label: "Линейное" },
    { value: "segmental", label: "Сегментарное" },
  ] as Opt[],
  asymmetryType: [
    { value: "asymmetry", label: "Асимметрия" },
    { value: "global", label: "Глобальная асимметрия" },
    { value: "focal", label: "Фокальная асимметрия" },
    { value: "developing", label: "Развивающаяся асимметрия" },
  ] as Opt[],
  associatedFeatures: [
    { value: "skin_retraction", label: "Втяжение кожи" },
    { value: "nipple_retraction", label: "Втяжение соска" },
    { value: "skin_thickening", label: "Утолщение кожи" },
    { value: "trabecular_thickening", label: "Утолщение трабекул" },
    { value: "axillary_adenopathy", label: "Аксиллярная аденопатия" },
    { value: "architectural_distortion_assoc", label: "Нарушение архитектоники (ассоц.)" },
  ] as Opt[],
  comparison: [
    { value: "none", label: "Сравнение недоступно / не выполнялось" },
    { value: "stable", label: "Стабильно относительно предыдущих" },
    { value: "new", label: "Новая находка" },
    { value: "increased", label: "Увеличение / нарастание" },
    { value: "decreased", label: "Уменьшение" },
  ] as Opt[],
  categories: [
    { value: "0", label: "BI-RADS 0" },
    { value: "1", label: "BI-RADS 1" },
    { value: "2", label: "BI-RADS 2" },
    { value: "3", label: "BI-RADS 3" },
    { value: "4A", label: "BI-RADS 4A" },
    { value: "4B", label: "BI-RADS 4B" },
    { value: "4C", label: "BI-RADS 4C" },
    { value: "5", label: "BI-RADS 5" },
    { value: "6", label: "BI-RADS 6" },
  ] as Opt[],
};

export const BIRADS_MMG_CATEGORY_RECOMMENDATIONS: Record<string, string> = {
  "0": "Неполная оценка — дополнительные проекции / томосинтез / УЗИ / сравнение с архивом.",
  "1": "Отрицательное исследование. Рутинный скрининг по возрасту и протоколу.",
  "2": "Доброкачественные находки. Рутинный скрининг.",
  "3": "Вероятно доброкачественное (≤2%). Короткий интервал наблюдения (часто 6 мес.).",
  "4A": "Низкая степень подозрения (>2–≤10%). Морфологическая верификация по показаниям.",
  "4B": "Промежуточная степень подозрения (>10–≤50%). Верификация рекомендована.",
  "4C": "Высокая степень подозрения (>50–<95%). Верификация рекомендована.",
  "5": "Высокая вероятность злокачественности (≥95%). Онкомаршрут, верификация.",
  "6": "Морфологически подтверждённое ЗНО. Лечение / наблюдение онколога.",
};

export const BIRADS_MMG_STEPS = [
  { id: 1, title: "Шаг 1", subtitle: "Плотность паренхимы" },
  { id: 2, title: "Шаг 2", subtitle: "Тип находки" },
  { id: 3, title: "Шаг 3", subtitle: "Дескрипторы" },
  { id: 4, title: "Шаг 4", subtitle: "Ассоциированные признаки" },
  { id: 5, title: "Шаг 5", subtitle: "Сравнение и категория" },
] as const;

export const defaultBiradsMmgInput: BiradsMmgInput = {
  breastComposition: "b",
  findingType: "mass",
  massShape: "oval",
  massMargin: "circumscribed",
  massDensity: "equal",
  calcMorphology: "typically_benign",
  calcDistribution: "grouped",
  asymmetryType: "focal",
  associatedFeatures: [],
  comparison: "none",
};
