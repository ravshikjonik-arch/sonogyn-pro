/** Russian prose templates for SRE (Phase 1 · adnex). */
export const ru = {
  report: {
    assistive_footer:
      "Заключение сформировано в assistive-режиме; не является гистологическим диагнозом. Интерпретация — лечащий специалист.",
    study_region_adnex: "Органы малого таза · трансвагинальное УЗИ · придатки",
  },
  adnex: {
    section_description: "Описание",
    section_impression: "Заключение",
    localization: {
      ovarian: "яичник / придаток",
      extraovarian: "экстраовариальная локализация",
    },
    menopause: { pre: "пременопауза", post: "постменопауза", unknown: "менопаузальный статус не указан" },
    lesionKind: { physiological: "физиологическое образование", nonphysiological: "нефизиологическое образование" },
    structure: { unilocular: "однокамерное", multilocular: "многокамерное", solid: "солидное" },
    septa: { thin: "тонкие перегородки", thick: "утолщённые перегородки" },
    solidType: { smooth: "ровный солидный компонент", irregular: "неровный солидный компонент", papillary: "папиллярные разрастания" },
    bloodFlow: { none: "васкуляризация не определяется", minimal: "минимальный кровоток", moderate: "умеренный кровоток", marked: "выраженный кровоток" },
    measurements: (maxMm: number, vol?: number) => {
      const parts = [`наибольший размер ${maxMm} мм`];
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
} as const;

export type RuCatalog = typeof ru;
