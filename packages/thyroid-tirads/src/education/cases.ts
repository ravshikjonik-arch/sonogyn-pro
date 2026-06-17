import type { TiradsRuCategory, TiradsRuInput } from "../types";

export type TiradsEducationCase = {
  id: string;
  figureRef: string;
  title: string;
  teachingPoint: string;
  expectedCategory: TiradsRuCategory;
  expectedTiMds?: string;
  preset: TiradsRuInput;
};

/** Ситуационные задачи — ключи из таблицы пособия (стр. 64–65). */
export const SITUATIONAL_CASES: TiradsEducationCase[] = [
  {
    id: "fig-3-1",
    figureRef: "Рис. 3.1",
    title: "Протокол осмотра ЩЖ",
    teachingPoint: "Нормальная анатомия / без подозрительного узла → TI-RADS 1.",
    expectedCategory: "1",
    preset: {
      composition: "none",
      echogenicity: "iso_hyper",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
    },
  },
  {
    id: "fig-4-1",
    figureRef: "Рис. 4.1",
    title: "Солидный гипоэхогенный узел",
    teachingPoint: "Гипоэхогенный солидный узел без «крупных» признаков → TI-RADS 4.",
    expectedCategory: "4",
    expectedTiMds: "5",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider",
      margin: "ill_defined",
      calcification: "none",
      largestDiameterMm: 14,
    },
  },
  {
    id: "fig-4-2",
    figureRef: "Рис. 4.2",
    title: "Границы узла",
    teachingPoint: "Чёткие vs нечёткие границы — важный дескриптор; доброкачественный паттерн → TI-RADS 2.",
    expectedCategory: "2",
    preset: {
      composition: "spongiform",
      echogenicity: "iso_hyper",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
      largestDiameterMm: 12,
    },
  },
  {
    id: "fig-4-5",
    figureRef: "Рис. 4.5",
    title: "Эхогенность",
    teachingPoint: "Изо-/гиперэхогенный солидный узел → TI-RADS 3.",
    expectedCategory: "3",
    preset: {
      composition: "solid",
      echogenicity: "iso_hyper",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
      largestDiameterMm: 11,
    },
  },
  {
    id: "fig-4-9",
    figureRef: "Рис. 4.9",
    title: "Коллоидная киста",
    teachingPoint: "Кистозный / коллоидный узел → TI-RADS 2.",
    expectedCategory: "2",
    preset: {
      composition: "simple_cyst",
      echogenicity: "anechoic",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
      largestDiameterMm: 18,
    },
  },
  {
    id: "fig-4-11",
    figureRef: "Рис. 4.11",
    title: "Микрокальцификаты",
    teachingPoint: "Пунктатные микрокальцификаты — крупный признак → TI-RADS 5.",
    expectedCategory: "5",
    expectedTiMds: "5",
    preset: {
      composition: "solid",
      echogenicity: "markedly_hypoechoic",
      shape: "taller",
      margin: "irregular",
      calcification: "micro",
      largestDiameterMm: 9,
    },
  },
  {
    id: "fig-6-6",
    figureRef: "Рис. 6.6",
    title: "TI-RADS 4 — умеренно гипоэхогенный",
    teachingPoint: "Солидный узел умеренно пониженной эхогенности >1 см → TI-RADS 4, рассмотреть ТАБ.",
    expectedCategory: "4",
    preset: {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider",
      margin: "smooth",
      calcification: "none",
      largestDiameterMm: 16,
    },
  },
  {
    id: "fig-6-8",
    figureRef: "Рис. 6.8",
    title: "TI-RADS 5 — папиллярный рак",
    teachingPoint: "Значительная гипоэхогенность + вертикальная ориентация + неровный контур.",
    expectedCategory: "5",
    preset: {
      composition: "solid",
      echogenicity: "markedly_hypoechoic",
      shape: "taller",
      margin: "irregular",
      calcification: "micro",
      largestDiameterMm: 12,
    },
  },
];

export const CHAPTER_OUTLINE = [
  { id: "intro", title: "Введение", topics: ["Роль TI-RADS в РФ", "Мультипараметрическая оценка", "TI-MDS"] },
  { id: "anatomy", title: "Раздел 1–2", topics: ["Анатомия ЩЖ", "Терминология (Прил. 2)"] },
  { id: "descriptors", title: "Раздел 3–5", topics: ["Протокол осмотра", "B-режим", "Допплер", "Эластография"] },
  { id: "tirads", title: "Раздел 6", topics: ["Категории TI-RADS 1–5", "Пороги ТАБ", "Группа риска"] },
  { id: "report", title: "Раздел 9", topics: ["Шаблон заключения", "Bethesda (Прил. 4)"] },
  { id: "practice", title: "Практика", topics: ["Контрольные вопросы", "Тесты", "Ситуационные задачи"] },
];

export { SITUATIONAL_CASES as situationalCases };
