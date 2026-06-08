import type { SecondThirdInput } from "../types";

/**
 * Учебные примеры по структуре III скрининга (30–34 нед.) — общие блоки:
 * фетометрия, ликворные пространства, анатомия, плацента/воды, допплер, шейка.
 * Исходный материал: курс Uzicenter «Скрининговое ультразвуковое исследование в 30–34 н.»
 * (PDF на Desktop — страницы как изображения; литературные ориентиры, не копия таблиц из файла).
 * Не заменяет локальный протокол и клиническое решение.
 */
export const FMF_SCREENING_3034_SOURCE_NOTE =
  "Примеры по структуре III скрининга (30–34 н.), в духе протокола Uzicenter. Цифры — типовые учебные ориентиры; сверяйте с вашим МЗ и FMF.";

export type FmfThirdScreeningExample = {
  id: string;
  title: string;
  subtitle: string;
  /** Строка для голосового блока (парсер FMF понимает бпр, ог, ож, дб, чсс, желудочки …) */
  voiceHint: string;
  input: SecondThirdInput;
};

const base: Pick<SecondThirdInput, "fetusPresentation" | "nasalBoneSeen" | "stomachSeen" | "bladderSeen"> = {
  fetusPresentation: "cephalic",
  nasalBoneSeen: true,
  stomachSeen: true,
  bladderSeen: true,
};

export const fmfScreening3034Examples: FmfThirdScreeningExample[] = [
  {
    id: "norm_32w",
    title: "Норма, ~32 нед.",
    subtitle: "Фетометрия по сроку, ИАЖ и допплер без красных флагов.",
    voiceHint: "головное бпр 84 ог 302 ож 285 дб 64 чсс 142 желудочки 6 мозжечок 38 большая цистерна 5",
    input: {
      ...base,
      gaWeeksByLmp: 32,
      gaDaysByLmp: 3,
      bpd: 84,
      ofd: 108,
      hc: 302,
      ac: 285,
      fl: 64,
      fhr: 142,
      lateralVentriclesMm: 6.0,
      cerebellumMm: 38,
      cisternaMagnaMm: 5.0,
      placentaDistanceToOsCm: 4.5,
      afiCm: 14.5,
      placentaThicknessMm: 35,
      cervixLengthMm: 34,
      uterinePiMean: 0.95,
      uaPi: 0.88,
      uaRi: 0.63,
      mcaPi: 1.45,
      mcaPsv: 45,
      dvPi: 0.38,
    },
  },
  {
    id: "oligo_33w",
    title: "Маловодие, ~33 нед.",
    subtitle: "Снижен ИАЖ, PSV СМА >1,5 MoM — маловодие + подозрение на анемию.",
    voiceHint: "головное бпр 86 ог 310 ож 278 дб 65 чсс 138 желудочки 7",
    input: {
      ...base,
      gaWeeksByLmp: 33,
      gaDaysByLmp: 0,
      bpd: 86,
      ofd: 110,
      hc: 310,
      ac: 278,
      fl: 65,
      fhr: 138,
      lateralVentriclesMm: 7.0,
      cerebellumMm: 39,
      cisternaMagnaMm: 4.8,
      placentaDistanceToOsCm: 5.0,
      afiCm: 4.2,
      placentaThicknessMm: 38,
      cervixLengthMm: 30,
      uterinePiMean: 1.05,
      uaPi: 1.15,
      uaRi: 0.72,
      mcaPi: 1.35,
      mcaPsv: 72,
      dvPi: 0.42,
    },
  },
  {
    id: "uterine_notch_31w",
    title: "Высокий PI маточных, ~31 нед.",
    subtitle: "Риск плацентарной недостаточности — корреляция с клиникой, CTG, повтор УЗД.",
    voiceHint: "головное бпр 80 ог 292 ож 270 дб 60 чсс 145 желудочки 6",
    input: {
      ...base,
      gaWeeksByLmp: 31,
      gaDaysByLmp: 4,
      bpd: 80,
      ofd: 104,
      hc: 292,
      ac: 270,
      fl: 60,
      fhr: 145,
      lateralVentriclesMm: 6.2,
      cerebellumMm: 36,
      cisternaMagnaMm: 5.2,
      placentaDistanceToOsCm: 3.8,
      afiCm: 12.0,
      placentaThicknessMm: 36,
      cervixLengthMm: 32,
      uterinePiMean: 1.52,
      uaPi: 1.05,
      uaRi: 0.66,
      mcaPi: 1.2,
      mcaPsv: 38,
      dvPi: 0.55,
    },
  },
  {
    id: "ventric_borderline_34w",
    title: "Пограничные желудочки, ~34 нед.",
    subtitle: "Уточнить нейросонографию / консилиум по локальным порогам.",
    voiceHint: "головное бпр 88 ог 318 ож 300 дб 67 чсс 136 желудочки 10.2",
    input: {
      ...base,
      gaWeeksByLmp: 34,
      gaDaysByLmp: 0,
      bpd: 88,
      ofd: 112,
      hc: 318,
      ac: 300,
      fl: 67,
      fhr: 136,
      lateralVentriclesMm: 10.2,
      cerebellumMm: 40,
      cisternaMagnaMm: 5.0,
      placentaDistanceToOsCm: 6.0,
      afiCm: 13.0,
      placentaThicknessMm: 37,
      cervixLengthMm: 28,
      uterinePiMean: 1.0,
      uaPi: 0.92,
      uaRi: 0.58,
      mcaPi: 1.4,
      mcaPsv: 50,
      dvPi: 0.4,
    },
  },
  {
    id: "breech_30w",
    title: "Тазовое предлежание, ~30 нед.",
    subtitle: "Обсуждение тактики родоразрешения позже по сроку и клинике.",
    voiceHint: "тазовое бпр 78 ог 285 ож 262 дб 58 чсс 148 желудочки 6",
    input: {
      fetusPresentation: "breech",
      nasalBoneSeen: true,
      stomachSeen: true,
      bladderSeen: true,
      gaWeeksByLmp: 30,
      gaDaysByLmp: 2,
      bpd: 78,
      ofd: 100,
      hc: 285,
      ac: 262,
      fl: 58,
      fhr: 148,
      lateralVentriclesMm: 6.0,
      cerebellumMm: 35,
      cisternaMagnaMm: 4.9,
      placentaDistanceToOsCm: 7.0,
      afiCm: 16.0,
      placentaThicknessMm: 34,
      cervixLengthMm: 36,
      uterinePiMean: 0.9,
      uaPi: 0.85,
      uaRi: 0.62,
      mcaPi: 1.5,
      mcaPsv: 41,
      dvPi: 0.35,
    },
  },
];
