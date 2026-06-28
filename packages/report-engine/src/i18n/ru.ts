/** Russian prose templates for SRE (Phase 1 · adnex). */
import { formatMeasurementDecimal } from "@repo/medical-calculations";

export const ru = {
  report: {
    assistive_footer:
      "Заключение сформировано в assistive-режиме; не является гистологическим диагнозом. Интерпретация — лечащий специалист.",
    study_region_adnex: "Органы малого таза · трансвагинальное УЗИ · придатки",
    study_region_thyroid: "Щитовидная железа · УЗИ",
    study_region_obstetric: "Акушерское УЗИ · биометрия",
  },
  adnex: {
    section_description: "Описание",
    section_impression: "Заключение",
    localization: {
      ovarian: "яичник / придаток",
      extraovarian: "экстраовариальная локализация",
    },
    menopause: { pre: "пременопауза", post: "постменопауза", unknown: "менопаузальный статус не указан" },
    lesionKind: {
      physiological: "физиологическое образование",
      nonphysiological: "нефизиологическое образование",
      normal_ovary: "мультифолликулярный / нормальный яичник",
    },
    structure: { unilocular: "однокамерное", multilocular: "многокамерное", solid: "солидное" },
    septa: { thin: "тонкие перегородки", thick: "утолщённые перегородки" },
    solidType: { smooth: "ровный солидный компонент", irregular: "неровный солидный компонент", papillary: "папиллярные разрастания" },
    bloodFlow: { none: "васкуляризация не определяется", minimal: "минимальный кровоток", moderate: "умеренный кровоток", marked: "выраженный кровоток" },
    measurements: (maxMm: number, vol?: number) => {
      const parts = [`наибольший размер ${formatMeasurementDecimal(maxMm)} мм`];
      if (vol != null && vol > 0) parts.push(`объём ~${Math.round(vol * 10) / 10} мл`);
      return parts.join(", ");
    },
    orads_line: (cat: number, version: string) => `Категория O-RADS US: ${cat} (${version}).`,
    iota_line: (verdict: string, benign: string, malignant: string) =>
      `IOTA Simple Rules: ${verdict} (B: ${benign || "—"}; M: ${malignant || "—"}).`,
    agreement: {
      full: "Классификации O-RADS US и IOTA согласованы.",
      partial: "Частичное согласование O-RADS и IOTA — уточните плоскости сканирования и морфологию.",
      conflict: "Расхождение O-RADS и IOTA — рекомендуется экспертное УЗИ и пересмотр признаков.",
    },
    pitfall_prefix: "Уточнение по протоколу",
    missing_orads: "Категория O-RADS не указана — использована промежуточная O-RADS 3 для черновика; уточните классификацию.",
  },
  thyroid: {
    section_description: "Описание",
    section_impression: "Заключение",
    volume: (ml?: number) => (ml != null ? `Объём ЩЖ ${ml} мл.` : "Объём ЩЖ не указан."),
    nodule_size: (mm?: number) =>
      mm != null ? `Наибольший диаметр узла ${formatMeasurementDecimal(mm)} мм.` : "Размер узла не указан.",
    tirads_line: (label: string, points: number, risk: string) =>
      `ACR TI-RADS: ${label} · ${points} баллов · риск ${risk}.`,
    fna_yes: (rationale: string) => `ТАБ рекомендована. ${rationale}`,
    fna_no: (rationale: string) => `ТАБ не показана. ${rationale}`,
    follow_up: (text: string) => `Наблюдение: ${text}`,
  },
  obstetric: {
    section_description: "Описание",
    section_impression: "Заключение",
    ga: (weeks?: number, days?: number) => {
      if (weeks == null) return "Срок беременности не указан.";
      const d = days ?? 0;
      return `Срок по УЗ-биометрии ${weeks}+${d} нед.`;
    },
    biometry_line: (label: string, mm?: number) =>
      mm != null ? `${label}: ${formatMeasurementDecimal(mm)} мм.` : `${label}: не измерено.`,
    efw: (grams?: number) => (grams != null ? `Расчётная масса плода ~${grams} г.` : ""),
    placenta: (loc?: string) => (loc ? `Плацента: ${loc}.` : ""),
    fluid: (desc?: string) => (desc ? `Околоплодные воды: ${desc}.` : ""),
    recommendations: "Клиническая корреляция и протокол учреждения.",
  },
} as const;

export type RuCatalog = typeof ru;
