import type { AssistantOutput, EarlyInput, FirstTrimesterInput, SecondThirdInput } from "../types";
import { daysBetween, formatGa, gaDaysByCrl, hadlockEfwGrams } from "./fmfMath";
import { calcPercentile } from "./fmfPercentiles";

export function analyzeEarly(input: EarlyInput): AssistantOutput {
  const missingQuestions: string[] = [];
  if (!input.lmpDate && !input.crlMm) missingQuestions.push("Укажите ДПМ или КТР для датировки.");
  if (input.gestationalSacPresent === undefined) missingQuestions.push("Уточните: плодное яйцо визуализируется?");
  if (input.embryoPresent === undefined) missingQuestions.push("Уточните: эмбрион визуализируется?");
  if (input.embryoPresent && !input.crlMm) missingQuestions.push("Введите КТР эмбриона.");
  if (input.embryoPresent && !input.fhr) missingQuestions.push("Введите ЧСС эмбриона.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const recommendations: string[] = [];
  const visualHints = [
    "Плодное яйцо в полости матки",
    "Эмбрион + сердцебиение",
    "Желточный мешок",
    "Желтое тело в яичнике",
  ];
  const gaByLmpDays = input.lmpDate ? daysBetween(input.lmpDate) : null;
  const gaByCrlDays = input.crlMm ? gaDaysByCrl(input.crlMm) : null;
  const gaFinal = gaByCrlDays ?? gaByLmpDays;

  if (input.pregnancyLocation === "ectopic") {
    alerts.push("⚠️ Подозрение на внематочную беременность");
    recommendations.push("Срочная клиническая корреляция и контроль β-ХГЧ/УЗИ в динамике.");
  }
  if (input.retrochorionicHematoma) alerts.push("⚠️ Ретрохориальная гематома");
  if (input.gestationalSacPresent && !input.embryoPresent && (input.msdMm ?? 0) >= 25) {
    alerts.push("⚠️ Признаки анэмбрионии (плодное яйцо ≥25 мм без эмбриона)");
    recommendations.push("Контроль УЗИ через 5-7 дней, исключить ошибку срока.");
  }
  if (input.fhr) {
    const weeks = gaFinal ? gaFinal / 7 : null;
    if (weeks && weeks >= 6 && weeks < 7 && (input.fhr < 90 || input.fhr > 120)) alerts.push("⚠️ ЧСС вне ожидаемого диапазона 6 нед");
    if (weeks && weeks >= 7 && weeks < 9 && (input.fhr < 120 || input.fhr > 165)) alerts.push("⚠️ ЧСС вне ожидаемого диапазона 7-8 нед");
    if (weeks && weeks >= 9 && weeks <= 11 && (input.fhr < 170 || input.fhr > 195)) alerts.push("⚠️ ЧСС вне ожидаемого диапазона 9-10 нед");
  }
  if (input.corpusLuteumPresent === false) hypotheses.push("Отсутствие визуализации желтого тела: проверить оба яичника и повторить скан.");
  if (input.sacContourNormal === false) alerts.push("⚠️ Неровные контуры плодного яйца, требуется динамика.");
  if (gaFinal && gaFinal < 35) hypotheses.push("Слишком раннее сканирование может давать ложно-отрицательный результат по эмбриону.");

  const nextPrompt = !input.crlMm
    ? "Введите КТР (при наличии эмбриона)."
    : !input.fhr
      ? "Введите ЧСС эмбриона."
      : "Проверьте локализацию, желточный мешок и ретрохориальную область.";

  const conclusion = input.embryoPresent && input.fhr
    ? `Маточная беременность. Срок гестации по КТР: ${formatGa(gaByCrlDays)}. Сердцебиение эмбриона определяется, ЧСС — ${input.fhr} уд/мин. Желтое тело ${input.corpusLuteumPresent ? `визуализируется в ${input.corpusLuteumSide === "left" ? "левом" : "правом"} яичнике` : "четко не визуализируется"}.`
    : "Беременность малого срока, требуется динамическое наблюдение.";

  if (recommendations.length === 0) recommendations.push("Контроль по клинической ситуации, при сомнениях повтор УЗИ через 5-7 дней.");
  return { nextPrompt, alerts, hypotheses, conclusion, recommendations, visualHints, missingQuestions };
}

export function analyzeFirst(input: FirstTrimesterInput): AssistantOutput {
  const missingQuestions: string[] = [];
  if (!input.crlMm) missingQuestions.push("Введите КТР.");
  if (typeof input.ntMm !== "number") missingQuestions.push("Введите ТВП по FMF.");
  if (!input.nasalBone) missingQuestions.push("Уточните наличие носовой кости.");
  if (!input.dvFlow || input.dvFlow === "unknown") missingQuestions.push("Уточните допплер венозного протока.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const visualHints = [
    "Срединный сагиттальный срез",
    "Нейтральное положение головы",
    "Увеличение плода на 70-80% экрана",
  ];
  const ga = input.crlMm ? gaDaysByCrl(input.crlMm) : null;

  if (typeof input.ntMm === "number" && input.ntMm >= 3.5) alerts.push("⚠️ ТВП увеличено");
  if (input.nasalBone === "not_seen") alerts.push("⚠️ Носовая кость не визуализируется");
  if (input.dvFlow === "abnormal") alerts.push("⚠️ Патологический кровоток в венозном протоке");
  if (input.tricuspidRegurg === "present") alerts.push("⚠️ Трикуспидальная регургитация");
  if (input.fhr && (input.fhr < 110 || input.fhr > 180)) alerts.push("⚠️ ЧСС вне ожидаемого диапазона для 11-13+6 нед");

  if (alerts.length >= 2) hypotheses.push("Повышенный комбинированный риск хромосомной патологии, требуется расчет риска.");
  const nextPrompt = !input.crlMm ? "Введите КТР." : typeof input.ntMm !== "number" ? "Введите ТВП (строго FMF)." : "Оцените носовую кость и допплер (DV/TR).";
  const conclusion =
    alerts.length === 0
      ? `Первый скрининг: без значимых отклонений. Срок по КТР: ${formatGa(ga)}.`
      : `Первый скрининг: выявлены маркеры повышенного риска (${alerts.length}).`;
  const recommendations =
    alerts.length === 0
      ? ["Рутинное наблюдение по протоколу."]
      : ["Рассчитать комбинированный риск (Down/Edwards/Patau).", "Консультация специалиста пренатальной диагностики."];
  return { nextPrompt, alerts, hypotheses, conclusion, recommendations, visualHints, missingQuestions };
}

export function analyzeSecondThird(input: SecondThirdInput, trimester: "second" | "third", mode: "quick" | "strict" = "quick"): AssistantOutput {
  const missingQuestions: string[] = [];
  if (!input.bpd || !input.hc || !input.ac || !input.fl) missingQuestions.push("Введите обязательную фетометрию BPD/HC/AC/FL.");
  if (input.gaWeeksByLmp === undefined) missingQuestions.push("Уточните срок беременности (недели) для сравнения с нормами.");
  if (!input.fhr) missingQuestions.push("Введите ЧСС плода.");
  if (input.stomachSeen === undefined) missingQuestions.push("Уточните визуализацию желудка.");
  if (input.bladderSeen === undefined) missingQuestions.push("Уточните визуализацию мочевого пузыря.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const visualHints = ["4-камерный срез сердца", "Выходные тракты ЛЖ/ПЖ", "3 сосуда и трахея", "Срез мозга через боковые желудочки"];

  if ((input.lateralVentriclesMm ?? 0) > 10) alerts.push("⚠️ Вентрикуломегалия");
  if ((input.cisternaMagnaMm ?? 0) > 10) alerts.push("⚠️ Большая цистерна увеличена");
  if (input.nasalBoneSeen === false) alerts.push("⚠️ Носовые кости не визуализируются");
  if (input.stomachSeen === false) alerts.push("⚠️ Желудок не визуализируется");
  if (input.bladderSeen === false) alerts.push("⚠️ Мочевой пузырь не визуализируется");
  if ((input.placentaDistanceToOsCm ?? 99) < 2) alerts.push("⚠️ Низкая плацентация");
  if ((input.afiCm ?? 12) < 5) alerts.push("⚠️ Маловодие");
  if ((input.afiCm ?? 12) > 24) alerts.push("⚠️ Многоводие");
  if ((input.uterinePiMean ?? 0) > 1.4) alerts.push("⚠️ PI маточных артерий повышен (>95 перц.)");
  if ((input.mcaPi ?? 99) < 1.2) alerts.push("⚠️ PI СМА снижен (централизация кровотока)");
  if ((input.uaPi ?? 0) > 1.3) alerts.push("⚠️ PI артерии пуповины повышен");
  const efw = hadlockEfwGrams({ bpd: input.bpd, hc: input.hc, ac: input.ac, fl: input.fl });
  const acPc = calcPercentile("ac", input.ac, input.gaWeeksByLmp, mode);
  const efwPc = calcPercentile("efw", efw ?? undefined, input.gaWeeksByLmp, mode);
  if (acPc !== null && acPc < 10) alerts.push("⚠️ AC ниже 10 перцентиля (риск ЗВУР)");
  if (acPc !== null && acPc > 90) alerts.push("⚠️ AC выше 90 перцентиля (крупный плод)");
  if (efwPc !== null && efwPc < 10) alerts.push("⚠️ EFW ниже 10 перцентиля (риск ЗВУР)");

  if (alerts.some((x) => x.includes("централизация")) && alerts.some((x) => x.includes("пуповины"))) {
    hypotheses.push("Подозрение на гипоксию плода (централизация кровотока).");
    hypotheses.push("Рассмотреть КТГ, решение о госпитализации и допплер-контроль в краткий интервал.");
  }
  if (alerts.some((x) => x.includes("Вентрикуломегалия"))) {
    hypotheses.push("Проверить corpus callosum, TORCH-инфекции, обсудить генетическую консультацию.");
  }

  const nextPrompt = !input.bpd || !input.hc || !input.ac || !input.fl ? "Введите обязательную фетометрию (BPD/OFD/HC/AC/FL)." : "Проверьте анатомические структуры и допплер.";
  const gaText = `${input.gaWeeksByLmp ?? "?"} нед ${input.gaDaysByLmp ?? "?"} д`;
  const trimesterWord = trimester === "second" ? "II скрининг" : "III скрининг";
  const conclusion =
    alerts.length === 0
      ? `${trimesterWord}. Беременность ${gaText}. Один живой плод. Фетометрические показатели соответствуют сроку беременности. Данных за врожденные пороки развития не выявлено. Показатели маточно-плацентарного и плодово-плацентарного кровотока в пределах нормы.${efw ? ` Предполагаемая масса плода: ~${efw} г.` : ""}${acPc ? ` AC ~${acPc} перцентиль.` : ""}${efwPc ? ` EFW ~${efwPc} перцентиль.` : ""}`
      : `${trimesterWord}. Беременность ${gaText}. Выявлены отклонения: ${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}.${efw ? ` Предполагаемая масса плода: ~${efw} г.` : ""}${acPc ? ` AC ~${acPc} перцентиль.` : ""}${efwPc ? ` EFW ~${efwPc} перцентиль.` : ""}`;
  const recommendations =
    alerts.length === 0
      ? ["Плановый контроль УЗИ в 27-28 недель.", "Допплер/КТГ по показаниям."]
      : ["Консультация акушера-гинеколога.", "Повторный экспертный УЗ-контроль и допплер в динамике.", "При признаках гипоксии: КТГ и решение вопроса о госпитализации."];
  return { nextPrompt, alerts, hypotheses, conclusion, recommendations, visualHints, missingQuestions };
}

export function analyzeDoppler(input: { piRight?: number; piLeft?: number; piUmb?: number; piMca?: number }): AssistantOutput {
  const missingQuestions: string[] = [];
  if (typeof input.piRight !== "number") missingQuestions.push("Введите PI правой маточной артерии.");
  if (typeof input.piLeft !== "number") missingQuestions.push("Введите PI левой маточной артерии.");
  if (typeof input.piUmb !== "number") missingQuestions.push("Введите PI артерии пуповины.");
  if (typeof input.piMca !== "number") missingQuestions.push("Введите PI среднемозговой артерии.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const visualHints = ["Маточные артерии: правая/левая PI", "Артерия пуповины PI", "СМА PI"];

  if ((input.piRight ?? 0) > 1.4 || (input.piLeft ?? 0) > 1.4) alerts.push("⚠️ Риск преэклампсии (маточные PI >95 перц.)");
  if ((input.piMca ?? 99) < 1.2) alerts.push("⚠️ Централизация кровотока (PI СМА снижен)");
  if ((input.piUmb ?? 0) > 1.3 && (input.piMca ?? 99) < 1.2) {
    hypotheses.push("Подозрение на гипоксию плода: повышение PI АП + снижение PI СМА.");
  }

  return {
    nextPrompt: "Введите PI правой/левой маточных артерий, PI АП и PI СМА.",
    alerts,
    hypotheses,
    conclusion:
      alerts.length === 0
        ? "Допплерометрические показатели в пределах ожидаемых значений."
        : `Допплер: выявлены отклонения (${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}).`,
    recommendations:
      alerts.length === 0
        ? ["Плановый контроль по сроку."]
        : ["Динамический контроль допплера и КТГ по показаниям.", "Консультация акушера-гинеколога."],
    visualHints,
    missingQuestions,
  };
}

export function analyzeCervix(input: { lengthMm?: number; funneling?: boolean }): AssistantOutput {
  const missingQuestions: string[] = [];
  if (typeof input.lengthMm !== "number") missingQuestions.push("Введите длину шейки матки (мм).");
  if (typeof input.funneling !== "boolean") missingQuestions.push("Уточните наличие funneling.");
  const alerts: string[] = [];
  if ((input.lengthMm ?? 99) < 25) alerts.push("⚠️ Риск преждевременных родов (шейка <25 мм)");
  if (input.funneling) alerts.push("⚠️ Funneling внутреннего зева");
  return {
    nextPrompt: "Введите длину шейки матки и наличие funneling.",
    alerts,
    hypotheses: alerts.length ? ["Цервикальная недостаточность: оценить клинический риск и динамику."] : [],
    conclusion:
      alerts.length === 0
        ? "Шейка матки без значимых изменений."
        : `Выявлены изменения шейки матки: ${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}.`,
    recommendations: alerts.length ? ["Рассмотреть консультацию и тактику профилактики ПР."] : ["Плановый контроль."],
    visualHints: ["Трансвагинальное измерение длины шейки в сагиттальной плоскости"],
    missingQuestions,
  };
}

export function analyzeScar(input: { thicknessMm?: number; structure?: "homogeneous" | "heterogeneous" }): AssistantOutput {
  const missingQuestions: string[] = [];
  if (typeof input.thicknessMm !== "number") missingQuestions.push("Введите толщину рубца (мм).");
  if (!input.structure) missingQuestions.push("Уточните структуру рубца (однородный/неоднородный).");
  const alerts: string[] = [];
  if ((input.thicknessMm ?? 99) < 2.5) alerts.push("⚠️ Несостоятельность рубца (толщина <2.5 мм)");
  if (input.structure === "heterogeneous") alerts.push("⚠️ Неоднородная структура рубца");
  return {
    nextPrompt: "Введите толщину рубца и характер структуры.",
    alerts,
    hypotheses: alerts.length ? ["Повышенный риск осложнений по рубцу на матке."] : [],
    conclusion:
      alerts.length === 0
        ? "Рубец на матке без значимых ультразвуковых признаков несостоятельности."
        : `Выявлены признаки несостоятельности рубца: ${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}.`,
    recommendations: alerts.length ? ["Консультация акушера-гинеколога, индивидуализация тактики ведения."] : ["Плановый контроль рубца."],
    visualHints: ["Оценка рубца в зоне нижнего сегмента, толщина миометрия и однородность структуры"],
    missingQuestions,
  };
}
