import type { EarlyInput, FirstTrimesterInput, SecondThirdInput } from "../../../mobile/src/features/fmf/types";
import {
  assessFirstTrimesterMedvedev,
  formatMedvedevMarkerForProtocol,
  MEDVEDEV_FIRST_TRIMESTER_SOURCE,
} from "@repo/medvedev-reference";
import {
  assessSecondThirdMedvedev,
  formatMedvedevBiometryForProtocol,
  MEDVEDEV_BIOMETRY_SOURCE,
} from "@repo/medvedev-reference";
import {
  assessMedvedevDoppler,
  formatMedvedevDopplerForProtocol,
  MEDVEDEV_DV_SOURCE,
  MEDVEDEV_UTA_SOURCE,
} from "@repo/medvedev-reference";
import {
  assessMedvedevPlacentaAfi,
  formatMedvedevPlacentaAfiForProtocol,
} from "@repo/medvedev-reference";
import { daysBetween, formatGa, gaDaysByCrl, hadlockEfwGrams } from "../../../mobile/src/features/fmf/logic/fmfMath";

export type DopplerInput = {
  piRight?: number;
  piLeft?: number;
  /** Legacy PI UA — в Медведеве 2016 таблица RI (Прил. 37), см. uaRi. */
  piUmb?: number;
  uaRi?: number;
  piMca?: number;
  /** ПССК СМА, см/с — Прил. 38. */
  mcaPsv?: number;
  dvPi?: number;
  gaWeeks?: number;
  gaDays?: number;
};

export type CervixInput = {
  lengthMm?: number;
  funneling?: boolean;
};

export type ScarInput = {
  thicknessMm?: number;
  structure?: "homogeneous" | "heterogeneous";
};

export function formatProtocolField(value: string | number | undefined, suffix = ""): string {
  if (value === undefined || value === "") return "___";
  return `${value}${suffix}`;
}

export function presentProtocolText(
  value: boolean | undefined,
  yes = "визуализируется",
  no = "не визуализируется",
): string {
  if (value === undefined) return "___";
  return value ? yes : no;
}

export function resolveGestationalAgeText(input: EarlyInput | Pick<FirstTrimesterInput, "crlMm">): string {
  const byCrl = input.crlMm ? gaDaysByCrl(input.crlMm) : null;
  const byLmp = "lmpDate" in input && input.lmpDate ? daysBetween(input.lmpDate) : null;
  return formatGa(byCrl ?? byLmp);
}

export function isFirstTrimesterScreeningWindow(crlMm?: number): boolean | null {
  if (!crlMm) return null;
  const days = gaDaysByCrl(crlMm);
  if (days == null || days <= 0) return null;
  const weeks = days / 7;
  return weeks >= 11 && weeks <= 13 + 6 / 7;
}

function nasalBoneText(value: FirstTrimesterInput["nasalBone"]): string {
  if (value === "seen") return "визуализируется";
  if (value === "not_seen") return "не визуализируется";
  if (value === "uncertain") return "оценка затруднена";
  return "___";
}

function dvFlowText(value: FirstTrimesterInput["dvFlow"]): string {
  if (value === "normal") return "без патологии";
  if (value === "abnormal") return "патологический кровоток";
  if (value === "unknown") return "не оценён";
  return "___";
}

function tricuspidText(value: FirstTrimesterInput["tricuspidRegurg"]): string {
  if (value === "none") return "не выявлена";
  if (value === "present") return "выявлена";
  if (value === "unknown") return "не оценена";
  return "___";
}

export function buildEarlyProtocol(input: EarlyInput, conclusion: string, recommendations: string[]): string {
  const gaText = resolveGestationalAgeText(input);

  return [
    "УЗИ БЕРЕМЕННОСТИ МАЛОГО СРОКА (до 11 недель)",
    "",
    "1. ОБЩИЕ ДАННЫЕ",
    `- ДПМ: ${formatProtocolField(input.lmpDate)}`,
    `- β-ХГЧ: ${formatProtocolField(input.bHcg, " МЕ/мл")}`,
    `- Срок гестации: ${gaText}${input.crlMm ? " (по КТР)" : input.lmpDate ? " (по ДПМ)" : ""}`,
    `- Размеры матки: ${formatProtocolField(input.uterusSize)}`,
    "",
    "2. МАТКА",
    `- Плодное яйцо: ${presentProtocolText(input.gestationalSacPresent)}`,
    `- Средний диаметр плодного яйца (СДП): ${formatProtocolField(input.msdMm, " мм")}`,
    `- Контуры плодного яйца: ${input.sacContourNormal === false ? "неровные" : input.sacContourNormal === true ? "ровные" : "___"}`,
    `- Желточный мешок: ${presentProtocolText(input.yolkSacSeen)}`,
    `- Эмбрион: ${presentProtocolText(input.embryoPresent)}`,
    `- КТР: ${formatProtocolField(input.crlMm, " мм")}`,
    `- ЧСС: ${formatProtocolField(input.fhr, " уд/мин")}`,
    `- Локализация: ${input.pregnancyLocation === "ectopic" ? "подозрение на внематочную" : input.pregnancyLocation === "uterine" ? "маточная" : "___"}`,
    `- Ретрохориальная гематома: ${input.retrochorionicHematoma === true ? "да" : input.retrochorionicHematoma === false ? "нет" : "___"}`,
    "",
    "3. ЯИЧНИКИ",
    `- Желтое тело: ${presentProtocolText(input.corpusLuteumPresent)}`,
    `- Локализация: ${input.corpusLuteumSide === "right" ? "правый яичник" : input.corpusLuteumSide === "left" ? "левый яичник" : "___"}`,
    `- Диаметр желтого тела: ${formatProtocolField(input.corpusLuteumSizeMm, " мм")}`,
    "",
    "4. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "5. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Интерпретация — лечащим специалистом.",
  ].join("\n");
}

export function buildFirstTrimesterProtocol(
  input: FirstTrimesterInput,
  conclusion: string,
  recommendations: string[],
): string {
  const gaText = resolveGestationalAgeText(input);
  const medvedevLines = assessFirstTrimesterMedvedev(input).map(formatMedvedevMarkerForProtocol);
  const gaDaysTotal = input.crlMm ? gaDaysByCrl(input.crlMm) : null;
  const dopplerLines = assessMedvedevDoppler({
    gaDaysTotal,
    dvPi: input.dvPi,
    uterinePiRight: input.uterinePiRight,
    uterinePiLeft: input.uterinePiLeft,
  }).map(formatMedvedevDopplerForProtocol);

  return [
    "СКРИНИНГОВОЕ УЗИ ПЕРВОГО ТРИМЕСТРА (11+0 — 13+6 нед) — FMF",
    "",
    "1. ОБЩИЕ ДАННЫЕ",
    `- Срок по КТР: ${gaText}`,
    "- Один плод / хорионичность: ___",
    "",
    "2. УЗ-МАРКЕРЫ (FMF)",
    `- КТР: ${formatProtocolField(input.crlMm, " мм")}`,
    `- ТВП (NT): ${formatProtocolField(input.ntMm, " мм")}`,
    `- Длина носовой кости: ${formatProtocolField(input.nasalBoneLengthMm, " мм")}`,
    `- IV желудочек (ПЗР): ${formatProtocolField(input.ivVentricleMm, " мм")}`,
    `- ПИ венозного протока: ${formatProtocolField(input.dvPi)}`,
    `- ПИ маточной справа: ${formatProtocolField(input.uterinePiRight)}`,
    `- ПИ маточной слева: ${formatProtocolField(input.uterinePiLeft)}`,
    `- ЧСС: ${formatProtocolField(input.fhr, " уд/мин")}`,
    `- Носовая кость: ${nasalBoneText(input.nasalBone)}`,
    `- Кровоток DV (качественно): ${dvFlowText(input.dvFlow)}`,
    `- Трикуспидальная регургитация: ${tricuspidText(input.tricuspidRegurg)}`,
    "",
    "2a. ПЕРЦЕНТИЛИ (Медведев, Прил. 11)",
    ...medvedevLines,
    `- Источник: ${MEDVEDEV_FIRST_TRIMESTER_SOURCE}`,
    ...(dopplerLines.length
      ? ["", "2b. ДОППЛЕР (Медведев, Прил. 40 / 36)", ...dopplerLines, `- DV: ${MEDVEDEV_DV_SOURCE}`, `- UtA: ${MEDVEDEV_UTA_SOURCE}`]
      : []),
    "",
    "3. БИОХИМИЯ (комбинированный скрининг)",
    `- PAPP-A: ${formatProtocolField(input.pappA, " МЕ/л")}`,
    `- β-ХГЧ: ${formatProtocolField(input.betaHcg, " МЕ/мл")}`,
    "",
    "4. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "5. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Комбинированный риск — по протоколу FMF / лаборатории.",
  ].join("\n");
}

function presentationText(value: SecondThirdInput["fetusPresentation"]): string {
  if (value === "cephalic") return "головное";
  if (value === "breech") return "тазовое";
  if (value === "transverse") return "поперечное";
  return "___";
}

export function buildSecondThirdProtocol(
  input: SecondThirdInput,
  trimester: "second" | "third",
  conclusion: string,
  recommendations: string[],
): string {
  const trimesterTitle = trimester === "second" ? "ВО ВТОРОМ ТРИМЕСТРЕ" : "В ТРЕТЬЕМ ТРИМЕСТРЕ";
  const ga = `${formatProtocolField(input.gaWeeksByLmp)} недель ${formatProtocolField(input.gaDaysByLmp)} дней`;
  const efw = hadlockEfwGrams({ bpd: input.bpd, hc: input.hc, ac: input.ac, fl: input.fl });
  const biometryLines = assessSecondThirdMedvedev({ ...input, efwGrams: efw ?? undefined }).map(
    formatMedvedevBiometryForProtocol,
  );
  const placentaAfiLines = assessMedvedevPlacentaAfi({
    gaWeeksByLmp: input.gaWeeksByLmp,
    gaDaysByLmp: input.gaDaysByLmp,
    afiCm: input.afiCm,
    placentaThicknessMm: input.placentaThicknessMm,
  }).map(formatMedvedevPlacentaAfiForProtocol);

  return [
    "СКРИНИНГОВОЕ УЛЬТРАЗВУКОВОЕ ИССЛЕДОВАНИЕ",
    trimesterTitle,
    "",
    "1. ОБЩИЕ ДАННЫЕ",
    `- Срок беременности: ${ga}`,
    "",
    "2. ПОЛОЖЕНИЕ ПЛОДА",
    `- Один живой плод, положение: ${presentationText(input.fetusPresentation)}, предлежание: ${presentationText(input.fetusPresentation)}.`,
    "- Подвижность: сохранена.",
    "",
    "3. ФЕТОМЕТРИЯ",
    `- BPD: ${formatProtocolField(input.bpd, " мм")}`,
    `- OFD: ${formatProtocolField(input.ofd, " мм")}`,
    `- HC: ${formatProtocolField(input.hc, " мм")}`,
    `- AC: ${formatProtocolField(input.ac, " мм")}`,
    `- FL: ${formatProtocolField(input.fl, " мм")}`,
    ...(efw ? [`- EFW (Hadlock): ~${efw} г`] : []),
    "",
    "3a. ПЕРЦЕНТИЛИ (Медведев, Прил. 1 + 5–12)",
    ...(biometryLines.length ? biometryLines : ["- Укажите срок и фетометрию для расчёта перцентилей."]),
    `- Источник: ${MEDVEDEV_BIOMETRY_SOURCE}`,
    "",
    "4. СЕРДЦЕ ПЛОДА",
    `- ЧСС: ${formatProtocolField(input.fhr, " уд/мин")}, ритм: ___`,
    "",
    "5. АНАТОМИЯ ПЛОДА",
    `- Боковые желудочки: ${formatProtocolField(input.lateralVentriclesMm, " мм")}`,
    `- Мозжечок (поперечный): ${formatProtocolField(input.cerebellumMm, " мм")}`,
    `- Большая цистерна: ${formatProtocolField(input.cisternaMagnaMm, " мм")}`,
    `- ППП: ${formatProtocolField(input.cspWidthMm, " мм")}`,
    `- ДМТ: ${formatProtocolField(input.corpusCallosumLengthMm, " мм")}`,
    `- Длина носовой кости: ${formatProtocolField(input.nasalBoneLengthMm, " мм")}`,
    "- Полость прозрачной перегородки: ___",
    "- Мозолистое тело: б/о",
    "- Лицевые структуры, позвоночник, грудная клетка, конечности: б/о/уточнить",
    `- Носовые кости: ${presentProtocolText(input.nasalBoneSeen)}`,
    `- Желудок: ${presentProtocolText(input.stomachSeen)}`,
    `- Мочевой пузырь: ${presentProtocolText(input.bladderSeen)}`,
    "- Situs solitus.",
    "",
    "6. ПЛАЦЕНТА И ВОДЫ",
    `- Расстояние от плаценты до внутреннего зева: ${formatProtocolField(input.placentaDistanceToOsCm, " см")}`,
    "- Структура плаценты: б/о/уточнить.",
    `- Толщина плаценты (Прил. 34): ${formatProtocolField(input.placentaThicknessMm, " мм")}`,
    `- ИАЖ: ${formatProtocolField(input.afiCm, " см")}`,
    ...(placentaAfiLines.length ? ["", "6a. ПЕРЦЕНТИЛИ (Прил. 34 / 35)", ...placentaAfiLines] : []),
    "- Пуповина: 3 сосуда, обвитие: ___",
    "",
    "7. ШЕЙКА МАТКИ",
    `- Длина шейки: ${formatProtocolField(input.cervixLengthMm, " мм")}`,
    "",
    "8. ДОППЛЕР",
    `- Маточные артерии PI (среднее): ${formatProtocolField(input.uterinePiMean)}`,
    `- Артерия пуповины PI: ${formatProtocolField(input.uaPi)}`,
    `- Артерия пуповины RI (Прил. 37): ${formatProtocolField(input.uaRi)}`,
    `- Среднемозговая артерия PI: ${formatProtocolField(input.mcaPi)}`,
    `- Среднемозговая артерия PSV (Прил. 38): ${formatProtocolField(input.mcaPsv, " см/с")}`,
    `- Венозный проток PI: ${formatProtocolField(input.dvPi)}`,
    "",
    "9. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "10. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Интерпретация — лечащим специалистом.",
  ].join("\n");
}

export function buildDopplerProtocol(
  input: DopplerInput,
  conclusion: string,
  recommendations: string[],
): string {
  const gaDaysTotal =
    input.gaWeeks !== undefined ? input.gaWeeks * 7 + (input.gaDays ?? 0) : null;
  const dopplerLines = assessMedvedevDoppler({
    gaDaysTotal,
    dvPi: input.dvPi,
    uterinePiRight: input.piRight,
    uterinePiLeft: input.piLeft,
    mcaPi: input.piMca,
    mcaPsv: input.mcaPsv,
    uaRi: input.uaRi,
  }).map(formatMedvedevDopplerForProtocol);

  return [
    "ДОППЛЕРОМЕТРИЯ ПРИ БЕРЕМЕННОСТИ",
    "",
    "1. ОБЩИЕ ДАННЫЕ",
    `- Срок: ${input.gaWeeks !== undefined ? `${input.gaWeeks} нед ${input.gaDays ?? 0} д` : "___"}`,
    "",
    "2. МАТОЧНЫЕ АРТЕРИИ",
    `- PI справа: ${formatProtocolField(input.piRight)}`,
    `- PI слева: ${formatProtocolField(input.piLeft)}`,
    "",
    "3. ПЛОДОВО-ПЛАЦЕНТАРНЫЙ КРОВОТОК",
    `- ИР артерии пуповины (RI): ${formatProtocolField(input.uaRi)}`,
    `- PI артерии пуповины (если введён): ${formatProtocolField(input.piUmb)}`,
    `- PI среднемозговой артерии: ${formatProtocolField(input.piMca)}`,
    `- PSV среднемозговой артерии (Прил. 38): ${formatProtocolField(input.mcaPsv, " см/с")}`,
    `- PI венозного протока: ${formatProtocolField(input.dvPi)}`,
    ...(dopplerLines.length
      ? ["", "3a. ПЕРЦЕНТИЛИ (Медведев)", ...dopplerLines, `- DV: ${MEDVEDEV_DV_SOURCE}`, `- UtA: ${MEDVEDEV_UTA_SOURCE}`]
      : []),
    "",
    "4. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "5. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Интерпретация — лечащим специалистом.",
  ].join("\n");
}

export function buildCervixProtocol(
  input: CervixInput,
  conclusion: string,
  recommendations: string[],
): string {
  return [
    "УЗИ ШЕЙКИ МАТКИ (ТРАНСВАГИНАЛЬНО)",
    "",
    "1. ИЗМЕРЕНИЯ",
    `- Длина шейки матки (CL): ${formatProtocolField(input.lengthMm, " мм")}`,
    `- Funneling внутреннего зева: ${input.funneling === true ? "да" : input.funneling === false ? "нет" : "___"}`,
    "",
    "2. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "3. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Интерпретация — лечащим специалистом.",
  ].join("\n");
}

function scarStructureText(value: ScarInput["structure"]): string {
  if (value === "homogeneous") return "однородная";
  if (value === "heterogeneous") return "неоднородная";
  return "___";
}

export function buildScarProtocol(
  input: ScarInput,
  conclusion: string,
  recommendations: string[],
): string {
  return [
    "ОЦЕНКА РУБЦА НА МАТКЕ (после кесарева сечения)",
    "",
    "1. УЗ-ПРИЗНАКИ",
    `- Толщина миометрия в зоне рубца: ${formatProtocolField(input.thicknessMm, " мм")}`,
    `- Структура: ${scarStructureText(input.structure)}`,
    "",
    "2. ЗАКЛЮЧЕНИЕ",
    conclusion,
    "",
    "3. РЕКОМЕНДАЦИИ",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "Не диагноз. Тактика родоразрешения — индивидуально, акушер-гинеколог.",
  ].join("\n");
}
