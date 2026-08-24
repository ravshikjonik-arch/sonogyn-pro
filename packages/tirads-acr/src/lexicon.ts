import type {
  TiradsComposition,
  TiradsEchogenicFoci,
  TiradsEchogenicity,
  TiradsMargin,
  TiradsShape,
} from "./types";

export const ACR_TIRADS_VERSION = "ACR TI-RADS (2017)";

export type LexiconOption<T extends string> = { value: T; labelRu: string; points: number; definitionRu: string };

export const COMPOSITION_OPTIONS: LexiconOption<TiradsComposition>[] = [
  { value: "no_nodule", labelRu: "Нет узла / норма", points: 0, definitionRu: "TR1 — без очаговых образований." },
  { value: "cystic", labelRu: "Кистозный / почти полностью кистозный", points: 0, definitionRu: "Жидкостное содержимое >90%." },
  { value: "spongiform", labelRu: "Spongiform / губчатый", points: 0, definitionRu: "Множественные микрокисты >50% объёма." },
  { value: "mixed", labelRu: "Смешанный кистозно-солидный", points: 1, definitionRu: "Жидкий и твёрдый компоненты." },
  { value: "solid", labelRu: "Солидный / почти солидный", points: 2, definitionRu: "Солидная ткань >80%." },
];

export const ECHOGENICITY_OPTIONS: LexiconOption<TiradsEchogenicity>[] = [
  { value: "anechoic", labelRu: "Анэхогенный", points: 0, definitionRu: "Без внутренних эхо (киста)." },
  { value: "hyperechoic_or_isoechoic", labelRu: "Гипер- / изоэхогенный", points: 1, definitionRu: "Эхогенность ≥ паренхимы." },
  { value: "hypoechoic", labelRu: "Гипоэхогенный", points: 2, definitionRu: "Ниже паренхимы ЩЖ." },
  { value: "very_hypoechoic", labelRu: "Очень гипоэхогенный", points: 3, definitionRu: "Эхогенность ниже strap muscles." },
];

export const SHAPE_OPTIONS: LexiconOption<TiradsShape>[] = [
  { value: "wider_than_tall", labelRu: "Шире, чем выше (wider-than-tall)", points: 0, definitionRu: "Параллельная ориентация." },
  { value: "taller_than_wide", labelRu: "Выше, чем шире (taller-than-wide)", points: 3, definitionRu: "Подозрительная вертикальная ориентация." },
];

export const MARGIN_OPTIONS: LexiconOption<TiradsMargin>[] = [
  { value: "smooth", labelRu: "Ровные (smooth)", points: 0, definitionRu: "Чёткий ровный контур." },
  { value: "ill_defined", labelRu: "Нечёткие (ill-defined)", points: 0, definitionRu: "Размытые границы без инвазии." },
  { value: "lobulated_or_irregular", labelRu: "Дольчатые / неровные", points: 2, definitionRu: "Lobulated or irregular margin." },
  { value: "extrathyroidal_extension", labelRu: "Экстратиреоидное распространение", points: 3, definitionRu: "Признаки инвазии за кapsule." },
];

export const ECHOGENIC_FOCI_OPTIONS: LexiconOption<TiradsEchogenicFoci>[] = [
  { value: "none_or_comet_tail", labelRu: "Нет / крупный comet-tail", points: 0, definitionRu: "Colloid comet-tail — доброкачественный." },
  { value: "macrocalcifications", labelRu: "Макрокальцинаты", points: 1, definitionRu: "Крупные эхогенные включения с тенью." },
  { value: "peripheral_rim", labelRu: "Периферические (rim)", points: 2, definitionRu: "Кальцинаты по ободку." },
  { value: "punctate", labelRu: "Пунктатные микрокальцинаты", points: 3, definitionRu: "Мелкие echogenic foci без shadowing." },
];

export function pointsFor<T extends string>(options: LexiconOption<T>[], value: T): number {
  return options.find((o) => o.value === value)?.points ?? 0;
}
