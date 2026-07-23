import type { SecondThirdInput } from "../../../mobile/src/features/fmf/types";
import {
  assessMedvedevDoppler,
  assessSecondThirdMedvedev,
  formatMedvedevBiometryForProtocol,
  formatMedvedevDopplerForProtocol,
  formatMedvedevPlacentaAfiForProtocol,
  assessMedvedevPlacentaAfi,
  MEDVEDEV_BIOMETRY_SOURCE,
} from "@repo/medvedev-reference";
import { formatMm } from "@repo/medical-calculations";

import { hadlockEfwGrams } from "../../../mobile/src/features/fmf/logic/fmfMath";
import { formatProtocolField, presentProtocolText } from "./fmf-protocol-format";

import type { SecondThirdProtocolTemplateId } from "@repo/types";

export type { SecondThirdProtocolTemplateId } from "@repo/types";
export { DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE } from "@repo/types";

export type FmfProtocolTemplateMeta = {
  id: SecondThirdProtocolTemplateId;
  label: string;
  description: string;
  author?: string;
  sourceNote?: string;
  defaultForSecondThird?: boolean;
};

/** Шаблоны протокола II/III скрининга — врач выбирает в FMF-помощнике. */
export const FMF_SECOND_THIRD_PROTOCOL_TEMPLATES: FmfProtocolTemplateMeta[] = [
  {
    id: "yakubov-2023",
    label: "Якубов Р.В. · УЗИ + допплер II–III скрин",
    description:
      "Полный текст по шаблону «Скрининговое УЗИ во II/III триместре» — фетометрия, анатомия, плацента, допплер.",
    author: "Якубов Р.В.",
    sourceNote: "УЗИ+допплер 2-3 скрин (Pages, 2023)",
    defaultForSecondThird: true,
  },
  {
    id: "sonogyn-compact",
    label: "SonoGyn · компактный",
    description: "Краткая структура с перцентилями Медведева — для быстрой вставки.",
  },
];

function formatRuDecimal(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "___";
  return String(value).replace(".", ",");
}

function formatRuExamDate(iso?: string): string {
  if (!iso) return "«___» __________ ____ г.";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "«___» __________ ____ г.";
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return `«${String(d.getDate()).padStart(2, "0")}» ${months[d.getMonth()]} ${d.getFullYear()}г.`;
}

function bo(value: boolean | undefined, negative = "уточнить"): string {
  if (value === false) return negative;
  return "б/о";
}

function placentaLocationText(value: SecondThirdInput["placentaLocation"]): string {
  if (value === "anterior") return "по передней стенке";
  if (value === "posterior") return "по задней стенке";
  if (value === "lateral") return "по боковой стенке";
  if (value === "fundal") return "в дне матки";
  return "по передней / задней / боковой стенке и в дне матки";
}

function fetalPositionLine(input: SecondThirdInput): string {
  const stability = input.fetalPositionStable === false ? "неустойчивом" : "___";
  const pres =
    input.fetusPresentation === "cephalic"
      ? "головном"
      : input.fetusPresentation === "breech"
        ? "тазовом"
        : input.fetusPresentation === "transverse"
          ? "поперечном"
          : "головном / тазовом";
  return `Определяется один живой плод в ${stability} положении, ${pres} предлежание.`;
}

function externalGenitaliaText(value: SecondThirdInput["fetalSex"]): string {
  if (value === "female") return "по женскому типу";
  if (value === "male") return "по мужскому типу";
  return "по женскому / мужскому типу";
}

function uterinePiLine(side: "правая" | "левая", pi?: number, gaDaysTotal?: number | null): string[] {
  if (pi == null) {
    return [`${side} - ПИ (PI) = ___, (> 95 процентиля);`, "профиль спектра кровотока соответствует гестационному сроку."];
  }
  const assessments = assessMedvedevDoppler({
    gaDaysTotal,
    uterinePiRight: side === "правая" ? pi : undefined,
    uterinePiLeft: side === "левая" ? pi : undefined,
  });
  const marker = side === "правая" ? "uterinePiRight" : "uterinePiLeft";
  const percentileHint = assessments.find((a) => a.marker === marker)?.percentile;
  const pct = percentileHint != null ? ` (> ${percentileHint} процентиля)` : "";
  return [
    `${side} - ПИ (PI) = ${formatRuDecimal(pi)}${pct};`,
    "профиль спектра кровотока соответствует гестационному сроку.",
  ];
}

/** Протокол по шаблону Якубова Р.В. (II/III пренатальный скрининг + допплер). */
export function buildYakubovSecondThirdProtocol(
  input: SecondThirdInput,
  trimester: "second" | "third",
  conclusion: string,
  recommendations: string[],
): string {
  const ga =
    input.gaWeeksByLmp !== undefined
      ? `${input.gaWeeksByLmp} нед ${input.gaDaysByLmp ?? 0} д`
      : "___";
  const gaDaysTotal =
    input.gaWeeksByLmp !== undefined ? input.gaWeeksByLmp * 7 + (input.gaDaysByLmp ?? 0) : null;
  const efw = hadlockEfwGrams({ bpd: input.bpd, hc: input.hc, ac: input.ac, fl: input.fl });
  const efwPct =
    input.efwPercentile != null
      ? `${efw ?? "___"} гр (${input.efwPercentile} процентиль)`
      : efw
        ? `${efw} гр (___ процентиль)`
        : "___ гр (___ процентиль)";

  const biometryLines = assessSecondThirdMedvedev({ ...input, efwGrams: efw ?? undefined }).map(
    formatMedvedevBiometryForProtocol,
  );
  const placentaAfiLines = assessMedvedevPlacentaAfi({
    gaWeeksByLmp: input.gaWeeksByLmp,
    gaDaysByLmp: input.gaDaysByLmp,
    afiCm: input.afiCm,
    placentaThicknessMm: input.placentaThicknessMm,
  }).map(formatMedvedevPlacentaAfiForProtocol);

  const dopplerAssessments = assessMedvedevDoppler({
    gaDaysTotal,
    uterinePiRight: input.uterinePiRight ?? input.uterinePiMean,
    uterinePiLeft: input.uterinePiLeft ?? input.uterinePiMean,
    uaRi: input.uaRi,
    mcaPi: input.mcaPi,
    mcaPsv: input.mcaPsv,
    dvPi: input.dvPi,
  });
  const dopplerNotes = dopplerAssessments.map(formatMedvedevDopplerForProtocol);

  const trimesterNote =
    trimester === "second" ? "II триместр (18–22 нед.)" : "III триместр (34–36 нед.)";

  const utRight = input.uterinePiRight ?? input.uterinePiMean;
  const utLeft = input.uterinePiLeft ?? input.uterinePiMean;

  return [
    "СКРИНИНГОВОЕ УЛЬТРАЗВУКОВОЕ ИССЛЕДОВАНИЕ",
    "ВО ВТОРОМ / ТРЕТЬЕМ ТРИМЕСТРЕ БЕРЕМЕННОСТИ",
    "",
    formatRuExamDate(input.examDate),
    `Ф.И.О. пациентки: ${formatProtocolField(input.patientName)}`,
    `Возраст: ${formatProtocolField(input.patientAge)} лет.`,
    `Первый день последней менструации: ${formatProtocolField(input.lmpDate)}.`,
    `Срок беременности: ${ga}. (${trimesterNote})`,
    fetalPositionLine(input),
    "",
    "ФЕТОМЕТРИЯ:",
    `Бипариетальный размер головы (BPD): ${formatProtocolField(input.bpd, " мм")}`,
    `Лобно-затылочный размер (OFD): ${formatProtocolField(input.ofd, " мм")}`,
    `Окружность головы (HC): ${formatProtocolField(input.hc, " мм")}`,
    `Окружность живота (AC): ${formatProtocolField(input.ac, " мм")}`,
    `Длина бедренной кости (FL): ${formatProtocolField(input.fl, " мм")}`,
    `Длина плечевой кости (HL): ${formatProtocolField(input.hlMm, " мм")}`,
    `Длина локтевой кости (UL): ${formatProtocolField(input.ulMm, " мм")}`,
    `Длина большеберцовой кости (TL): ${formatProtocolField(input.tlMm, " мм")}`,
    `Длина стопы: ${formatProtocolField(input.footLengthMm, " мм")}`,
    "Размеры плода пропорциональны и соответствуют сроку беременности.",
    `Сердцебиение ${formatProtocolField(input.fhr, " уд/мин")}, ритмичное.`,
    `ПМП (EFW) – ${efwPct}.`,
    `Длина плода – ${formatProtocolField(input.fetalLengthCm, " см")}.`,
    ...(biometryLines.length
      ? ["", "Перцентили фетометрии (Медведев):", ...biometryLines, `- Источник: ${MEDVEDEV_BIOMETRY_SOURCE}`]
      : []),
    "",
    "АНАТОМИЯ ПЛОДА:",
    `Боковые желудочки мозга – ${formatProtocolField(input.lateralVentriclesMm, " мм")}`,
    `Мозжечок – ${formatProtocolField(input.cerebellumMm, " мм")}`,
    `Большая цистерна – ${formatProtocolField(input.cisternaMagnaMm, " мм")}`,
    `Полость прозрачной перегородки (ППП) – ${input.cspWidthMm != null ? formatMm(input.cspWidthMm) : "б/о"}`,
    `Мозолистое тело – ${input.corpusCallosumLengthMm != null ? formatMm(input.corpusCallosumLengthMm) : "б/о"}`,
    `Сильвиева борозда – ${bo(undefined)}`,
    `Лицевые структуры: профиль – ${bo(undefined)}`,
    `Носовые кости – ${presentProtocolText(input.nasalBoneSeen)}`,
    `Длина носовых костей – ${formatProtocolField(input.nasalBoneLengthMm, " мм")}`,
    `Толщина преназальной ткани – ${formatProtocolField(input.prenasalThicknessMm, " мм")}`,
    `Соотношение ТПТ/ДНК – ${formatProtocolField(input.tptNbRatio)}`,
    `Носогубный треугольник – ${bo(undefined)}`,
    `Глазницы – ${bo(undefined)}`,
    "Область шеи – не изменена.",
    `Позвоночник – ${bo(undefined)}`,
    "Конечности – б/о.",
    "Расположение внутренних органов – situs solitus.",
    `Грудная клетка – ${bo(undefined)}`,
    "Лёгкие – б/о.",
    "Сердце определяется в типичном месте, ось сердца отклонена влево, размеры не увеличены.",
    "4-камерный срез сердца – б/о.",
    "Срез через 3 сосуда – б/о.",
    "Срез через дугу аорты – б/о.",
    "Выходной тракт левого желудочка – б/о.",
    "Выходной тракт правого желудочка – б/о.",
    `Желудок – ${bo(input.stomachSeen)}`,
    "Кишечник – б/о.",
    "Печень – б/о.",
    "Желчный пузырь – б/о.",
    "Почки – б/о.",
    `Мочевой пузырь – ${bo(input.bladderSeen)}`,
    "Место прикрепления пуповины к передней брюшной стенке – б/о.",
    `Наружные половые органы сформированы правильно, ${externalGenitaliaText(input.fetalSex)}.`,
    "Анальный сфинктер – б/о.",
    "",
    "ПЛАЦЕНТА, ПУПОВИНА, ОКОЛОПЛОДНЫЕ ВОДЫ:",
    `Плацента расположена ${placentaLocationText(input.placentaLocation)}, ${formatProtocolField(input.placentaDistanceToOsCm, "")}см выше внутреннего зева.`,
    `Толщина плаценты: нормальная, до ${formatProtocolField(input.placentaThicknessMm, " мм")}`,
    "Структура плаценты – б/о.",
    `Количество околоплодных вод: нормальное (макс. вертикальный карман ${formatProtocolField(input.maxVerticalPocketCm, " см")}, ИАЖ = ${formatProtocolField(input.afiCm, " см")}).`,
    ...(placentaAfiLines.length ? ["", "Перцентили плацента / ИАЖ:", ...placentaAfiLines] : []),
    "Пуповина имеет 3 сосуда, расположение спиральное, количество петель достаточное, объёмные образования не обнаружены.",
    "Прикрепление пуповины к плаценте – без особенностей.",
    "Обвития пуповины вокруг шеи плода не выявлено.",
    "",
    "Врождённые пороки развития / особенности анатомического строения плода: данных не обнаружено.",
    "",
    "ОБЛАСТЬ ПРИДАТКОВ, ШЕЙКА И СТЕНКИ МАТКИ: особенности строения – б/о.",
    `Длина закрытой части шейки матки (ТА) ${formatProtocolField(input.cervixLengthMm, " мм")}.`,
    "",
    `ВИЗУАЛИЗАЦИЯ: ${
      input.visualizationQuality === "limited"
        ? "ограниченная"
        : input.visualizationQuality === "poor"
          ? "неудовлетворительная"
          : "удовлетворительная"
    }.`,
    "",
    "ДОППЛЕРОМЕТРИЧЕСКОЕ ИССЛЕДОВАНИЕ",
    "ПЛАЦЕНТАРНОГО И ПЛОДОВОГО КРОВОТОКА",
    "",
    "1) МАТОЧНЫЕ АРТЕРИИ:",
    ...uterinePiLine("правая", utRight, gaDaysTotal),
    ...uterinePiLine("левая", utLeft, gaDaysTotal),
    "",
    "2) АРТЕРИЯ ПУПОВИНЫ:",
    `ИР (RI) = ${formatRuDecimal(input.uaRi)}; PI = ${formatRuDecimal(input.uaPi)}.`,
    "Профиль спектра кровотока соответствует гестационному сроку.",
    "",
    "3) СРЕДНЕМОЗГОВАЯ АРТЕРИЯ:",
    `ПИ (PI) = ${formatRuDecimal(input.mcaPi)}; ПССК (PSV) = ${formatProtocolField(input.mcaPsv, " см/с")}.`,
    "Профиль спектра кровотока соответствует гестационному сроку.",
    "",
    "4) ВЕНОЗНЫЙ ПРОТОК:",
    `ПИ (PI) = ${formatRuDecimal(input.dvPi)}.`,
    "Профиль спектра кровотока соответствует гестационному сроку.",
    ...(dopplerNotes.length ? ["", "Оценка по Медведеву:", ...dopplerNotes] : []),
    "",
    "ЗАКЛЮЧЕНИЕ:",
    conclusion,
    "",
    "РЕКОМЕНДАЦИИ:",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Интерпретация — лечащим специалистом.",
    "Шаблон: Якубов Р.В., УЗИ+допплер II–III скрининг.",
  ].join("\n");
}
