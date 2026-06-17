import type {
  TiradsRuCalcification,
  TiradsRuComposition,
  TiradsRuEchogenicity,
  TiradsRuMargin,
  TiradsRuShape,
  TiradsRuVascularization,
} from "./types";

export const MANUAL_SOURCE = {
  title: "Применение классификации TI-RADS при УЗ-мультипараметрической оценке узлов ЩЖ",
  authors: "Катрич А.Н., Фисенко Е.П., Ветшева Н.Н.",
  year: 2023,
  publisher: "Фирма СТРОМ, Москва",
};

export const DESCRIPTOR_LABELS = {
  composition: {
    none: "без узла / норма",
    simple_cyst: "простая киста",
    spongiform: "губчатый / коллоидный",
    mixed_cystic_solid: "смешанный (киста + ткань)",
    solid: "солидный / почти солидный",
  } satisfies Record<TiradsRuComposition, string>,
  echogenicity: {
    anechoic: "анэхогенный",
    iso_hyper: "изо- / гиперэхогенный",
    hypoechoic: "гипоэхогенный",
    markedly_hypoechoic: "значительно пониженная эхогенность",
  } satisfies Record<TiradsRuEchogenicity, string>,
  shape: {
    wider: "овальная / шире, чем выше",
    round: "округлая",
    taller: "вертикальная (выше, чем шире)",
  } satisfies Record<TiradsRuShape, string>,
  margin: {
    smooth: "ровный",
    ill_defined: "нечёткий",
    irregular: "неровный",
    lobulated: "дольчатый",
    microlobulated: "микродольчатый",
  } satisfies Record<TiradsRuMargin, string>,
  calcification: {
    none: "нет / крупный комет-хвост",
    macro: "макрокальцинат >1 мм",
    rim: "периферический (ободок)",
    micro: "пунктатные микрокальцинаты",
  } satisfies Record<TiradsRuCalcification, string>,
  vascularization: {
    none: "не оценивалась",
    peripheral: "перинодулярная",
    intranodular: "интранодулярная",
    pathological: "патологический рисунок",
  } satisfies Record<TiradsRuVascularization, string>,
};

export const HIGH_RISK_HINTS = [
  "Семейный анамнез рака ЩЖ",
  "Лучевая терапия шеи / облучение в анамнезе",
  "Метастатически подозрительные регионарные ЛУ",
  "ПЭТ-активность узла",
  "Возраст <20 лет",
  "Стойкая охриплость / симптомы сдавления",
];
