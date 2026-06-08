import type { AssistantOutput, EarlyInput, FirstTrimesterInput, SecondThirdInput } from "../types";
import { daysBetween, formatGa, gaDaysByCrl, hadlockEfwGrams } from "./fmfMath";
import { calcPercentile } from "./fmfPercentiles";
import { assessMedvedevDoppler } from "./medvedevDoppler";
import { assessFirstTrimesterMedvedev } from "./medvedevFirstTrimester";
import { assessSecondThirdMedvedev } from "./medvedevBiometry";
import { assessMedvedevPlacentaAfi } from "./medvedevPlacentaAfi";

function corpusLuteumSideText(side: EarlyInput["corpusLuteumSide"]): string {
  if (side === "left") return "левом";
  if (side === "right") return "правом";
  return "неуточнённом";
}

export function analyzeEarly(input: EarlyInput): AssistantOutput {
  const missingQuestions: string[] = [];
  if (!input.lmpDate && !input.crlMm) missingQuestions.push("Укажите ДПМ или КТР для датировки.");
  if (input.gestationalSacPresent === undefined) missingQuestions.push("Уточните: плодное яйцо визуализируется?");
  if (input.gestationalSacPresent && input.yolkSacSeen === undefined) {
    missingQuestions.push("Уточните: желточный мешок визуализируется?");
  }
  if (input.embryoPresent === undefined) missingQuestions.push("Уточните: эмбрион визуализируется?");
  if (input.embryoPresent && !input.crlMm) missingQuestions.push("Введите КТР эмбриона.");
  if (input.embryoPresent && !input.fhr) missingQuestions.push("Введите ЧСС эмбриона.");
  if (input.corpusLuteumPresent === undefined) {
    missingQuestions.push("Уточните: желтое тело в яичнике визуализируется?");
  }
  if (input.corpusLuteumPresent && !input.corpusLuteumSide) {
    missingQuestions.push("Укажите локализацию желтого тела (правый/левый яичник).");
  }
  if (input.corpusLuteumPresent && !input.corpusLuteumSizeMm) {
    missingQuestions.push("Введите диаметр желтого тела (мм).");
  }
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
  if (input.gestationalSacPresent && input.yolkSacSeen === false) {
    alerts.push("⚠️ Желточный мешок не визуализируется при наличии плодного яйца");
    recommendations.push("Контроль УЗИ через 5–7 дней, исключить ошибку срока и неразвивающуюся беременность.");
  }
  if (input.corpusLuteumPresent === false) {
    hypotheses.push("Отсутствие визуализации желтого тела: проверить оба яичника и повторить скан.");
  }
  if (input.corpusLuteumPresent && input.corpusLuteumSizeMm && input.corpusLuteumSizeMm > 30) {
    alerts.push("⚠️ Желтое тело >30 мм — оценить кистозные изменения и динамику.");
  }
  if (input.sacContourNormal === false) alerts.push("⚠️ Неровные контуры плодного яйца, требуется динамика.");
  if (gaFinal && gaFinal < 35) hypotheses.push("Слишком раннее сканирование может давать ложно-отрицательный результат по эмбриону.");

  const nextPrompt =
    input.gestationalSacPresent === undefined
      ? "Уточните наличие плодного яйца."
      : input.gestationalSacPresent && input.yolkSacSeen === undefined
        ? "Уточните желточный мешок."
        : input.corpusLuteumPresent === undefined
          ? "Уточните желтое тело в яичнике (сторона и диаметр)."
          : !input.crlMm
            ? "Введите КТР (при наличии эмбриона)."
            : !input.fhr
              ? "Введите ЧСС эмбриона."
              : "Проверьте ретрохориальную область и контуры плодного яйца.";

  const gaText = gaByCrlDays ? formatGa(gaByCrlDays) : gaByLmpDays ? formatGa(gaByLmpDays) : "не определён";
  const sacText = input.gestationalSacPresent
    ? `Плодное яйцо в полости матки${input.msdMm ? `, СДП ${input.msdMm} мм` : ""}.`
    : input.gestationalSacPresent === false
      ? "Плодное яйцо не визуализируется."
      : "";
  const yolkText =
    input.yolkSacSeen === true
      ? "Желточный мешок визуализируется."
      : input.yolkSacSeen === false
        ? "Желточный мешок не визуализируется."
        : "";
  const embryoText =
    input.embryoPresent && input.fhr
      ? `Эмбрион визуализируется, сердцебиение определяется, ЧСС ${input.fhr} уд/мин${input.crlMm ? `, КТР ${input.crlMm} мм` : ""}.`
      : input.embryoPresent === false
        ? "Эмбрион не визуализируется."
        : "";
  const clText = input.corpusLuteumPresent
    ? `Желтое тело визуализируется в ${corpusLuteumSideText(input.corpusLuteumSide)} яичнике${input.corpusLuteumSizeMm ? `, диаметр ${input.corpusLuteumSizeMm} мм` : ""}.`
    : input.corpusLuteumPresent === false
      ? "Желтое тело не визуализируется."
      : "";

  const conclusionParts = [
    input.pregnancyLocation === "ectopic" ? "Подозрение на внематочную локализацию." : "Маточная беременность.",
    `Срок гестации: ${gaText}.`,
    sacText,
    yolkText,
    embryoText,
    clText,
  ].filter(Boolean);

  const conclusion =
    conclusionParts.length > 1
      ? conclusionParts.join(" ")
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

  const medvedevMarkers = assessFirstTrimesterMedvedev(input);
  const gaDaysTotal = input.crlMm ? gaDaysByCrl(input.crlMm) : null;
  const medvedevDoppler = assessMedvedevDoppler({
    gaDaysTotal,
    dvPi: input.dvPi,
    uterinePiRight: input.uterinePiRight,
    uterinePiLeft: input.uterinePiLeft,
  });
  const ntMarker = medvedevMarkers.find((m) => m.marker === "nt");
  const nbMarker = medvedevMarkers.find((m) => m.marker === "nasalBone");
  const ivMarker = medvedevMarkers.find((m) => m.marker === "ivVentricle");

  if (ntMarker?.flag === "high") {
    alerts.push(`⚠️ ТВП выше 95-го перцентиля (~${ntMarker.percentile ?? ">95"}-й, Медведев Прил. 11)`);
  } else if (typeof input.ntMm === "number" && input.ntMm >= 3.5) {
    alerts.push("⚠️ ТВП увеличено (≥3,5 мм)");
  }
  if (input.nasalBone === "not_seen" || nbMarker?.flag === "low") {
    alerts.push("⚠️ Носовая кость не визуализируется или ниже 5-го перцентиля");
  }
  if (nbMarker?.flag === "high" && input.nasalBoneLengthMm !== undefined) {
    alerts.push(`⚠️ Длина носовой кости выше 95-го перцентиля (~${nbMarker.percentile ?? ">95"}-й)`);
  }
  if (ivMarker?.flag === "high") {
    alerts.push(`⚠️ IV желудочек выше 95-го перцентиля (~${ivMarker.percentile ?? ">95"}-й)`);
  }
  if (ivMarker?.flag === "low") {
    alerts.push(`⚠️ IV желудочек ниже 5-го перцентиля (~${ivMarker.percentile ?? "<5"}-й)`);
  }
  if (input.dvFlow === "abnormal") alerts.push("⚠️ Патологический кровоток в венозном протоке");
  for (const row of medvedevDoppler) {
    if (row.marker === "dvPi" && row.flag === "high") {
      alerts.push(`⚠️ ПИ венозного протока выше референса FMF (~${row.percentile ?? ">95"}-й перц.)`);
    }
    if (row.marker.startsWith("uterinePi") && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} выше 95-го перцентиля (~${row.percentile}-й)`);
    }
  }
  if (input.tricuspidRegurg === "present") alerts.push("⚠️ Трикуспидальная регургитация");
  if (input.fhr && (input.fhr < 110 || input.fhr > 180)) alerts.push("⚠️ ЧСС вне ожидаемого диапазона для 11-13+6 нед");

  if (alerts.length >= 2) hypotheses.push("Повышенный комбинированный риск хромосомной патологии, требуется расчет риска.");
  const nextPrompt = !input.crlMm ? "Введите КТР." : typeof input.ntMm !== "number" ? "Введите ТВП (строго FMF)." : "Оцените носовую кость и допплер (DV/TR).";

  const percentileNotes = [...medvedevMarkers, ...medvedevDoppler]
    .filter((m) => m.percentile !== undefined)
    .map((m) => `${m.label}: ~${m.percentile}-й перц.`)
    .join("; ");

  const conclusion =
    alerts.length === 0
      ? `Первый скрининг: без значимых отклонений. Срок по КТР: ${formatGa(ga)}.${percentileNotes ? ` ${percentileNotes}.` : ""}`
      : `Первый скрининг: выявлены маркеры повышенного риска (${alerts.length}).${percentileNotes ? ` ${percentileNotes}.` : ""}`;
  const recommendations =
    alerts.length === 0
      ? ["Рутинное наблюдение по протоколу."]
      : ["Рассчитать комбинированный риск (Down/Edwards/Patau).", "Консультация специалиста пренатальной диагностики."];
  return {
    nextPrompt,
    alerts,
    hypotheses,
    conclusion,
    recommendations,
    visualHints,
    missingQuestions,
    medvedevMarkers,
    medvedevDoppler,
  };
}

export function analyzeSecondThird(input: SecondThirdInput, trimester: "second" | "third", mode: "quick" | "strict" = "strict"): AssistantOutput {
  const missingQuestions: string[] = [];
  if (!input.bpd || !input.hc || !input.ac || !input.fl) missingQuestions.push("Введите обязательную фетометрию BPD/HC/AC/FL.");
  if (input.gaWeeksByLmp === undefined) missingQuestions.push("Уточните срок беременности (недели) для сравнения с нормами.");
  if (!input.fhr) missingQuestions.push("Введите ЧСС плода.");
  if (input.stomachSeen === undefined) missingQuestions.push("Уточните визуализацию желудка.");
  if (input.bladderSeen === undefined) missingQuestions.push("Уточните визуализацию мочевого пузыря.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const visualHints = ["4-камерный срез сердца", "Выходные тракты ЛЖ/ПЖ", "3 сосуда и трахея", "Срез мозга через боковые желудочки"];

  const efw = hadlockEfwGrams({ bpd: input.bpd, hc: input.hc, ac: input.ac, fl: input.fl });
  const medvedevBiometry = assessSecondThirdMedvedev({ ...input, efwGrams: efw ?? undefined });
  const gaDaysTotal =
    input.gaWeeksByLmp != null ? input.gaWeeksByLmp * 7 + (input.gaDaysByLmp ?? 0) : null;
  const medvedevDoppler = assessMedvedevDoppler({
    gaDaysTotal,
    uterinePiMean: input.uterinePiMean,
    mcaPi: input.mcaPi,
    mcaPsv: input.mcaPsv,
    dvPi: input.dvPi,
    uaRi: input.uaRi,
  });
  const medvedevPlacentaAfi = assessMedvedevPlacentaAfi({
    gaWeeksByLmp: input.gaWeeksByLmp,
    gaDaysByLmp: input.gaDaysByLmp,
    afiCm: input.afiCm,
    placentaThicknessMm: input.placentaThicknessMm,
  });

  const latMarker = medvedevBiometry.find((m) => m.marker === "lateralVentricle");
  const cisternaMarker = medvedevBiometry.find((m) => m.marker === "cisternaMagna");
  const acMarker = medvedevBiometry.find((m) => m.marker === "ac");
  const efwMarker = medvedevBiometry.find((m) => m.marker === "efw");

  if (latMarker?.flag === "high" || (input.lateralVentriclesMm ?? 0) > 10) {
    alerts.push(
      latMarker?.flag === "high"
        ? `⚠️ Лат. желудочки выше 95-го перцентиля (~${latMarker.percentile ?? ">95"}-й, Медведев)`
        : "⚠️ Вентрикуломегалия (>10 мм)",
    );
  }
  if (cisternaMarker?.flag === "high" || (input.cisternaMagnaMm ?? 0) > 10) {
    alerts.push(
      cisternaMarker?.flag === "high"
        ? `⚠️ Большая цистерна выше 95-го перцентиля (~${cisternaMarker.percentile ?? ">95"}-й)`
        : "⚠️ Большая цистерна увеличена (>10 мм)",
    );
  }
  if (input.nasalBoneSeen === false) alerts.push("⚠️ Носовые кости не визуализируются");
  const nbLengthMarker = medvedevBiometry.find((m) => m.marker === "nasalBoneLength");
  if (nbLengthMarker?.flag === "low") {
    alerts.push(`⚠️ Длина носовой кости ниже 5-го перцентиля (~${nbLengthMarker.percentile ?? "<5"}-й, Прил. 12)`);
  }
  const cspMarker = medvedevBiometry.find((m) => m.marker === "csp");
  if (cspMarker?.flag === "high") {
    alerts.push(`⚠️ ППП шире 95-го перцентиля (~${cspMarker.percentile ?? ">95"}-й)`);
  }
  if (input.stomachSeen === false) alerts.push("⚠️ Желудок не визуализируется");
  if (input.bladderSeen === false) alerts.push("⚠️ Мочевой пузырь не визуализируется");
  if ((input.placentaDistanceToOsCm ?? 99) < 2) alerts.push("⚠️ Низкая плацентация");
  const afiMarker = medvedevPlacentaAfi.find((m) => m.marker === "afi");
  if (afiMarker?.flag === "low") {
    alerts.push(`⚠️ ИАЖ ниже 5-го перцентиля (~${afiMarker.percentile ?? "<5"}-й, маловодие, Прил. 35)`);
  } else if (afiMarker?.flag === "high") {
    alerts.push(`⚠️ ИАЖ выше 95-го перцентиля (~${afiMarker.percentile ?? ">95"}-й, многоводие, Прил. 35)`);
  } else if (input.afiCm != null && medvedevPlacentaAfi.length === 0) {
    if (input.afiCm < 5) alerts.push("⚠️ Маловодие (ИАЖ <5 см — укажите срок для перцентиля Moore)");
    if (input.afiCm > 24) alerts.push("⚠️ Многоводие (ИАЖ >24 см — укажите срок для перцентиля Moore)");
  }
  for (const row of medvedevPlacentaAfi) {
    if (row.marker === "placentaThickness" && row.flag === "low") {
      alerts.push(`⚠️ ${row.label} ниже 5-го перцентиля (~${row.percentile ?? "<5"}-й, Прил. 34)`);
    }
    if (row.marker === "placentaThickness" && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} выше 95-го перцентиля (~${row.percentile ?? ">95"}-й, Прил. 34)`);
    }
  }
  if ((input.uterinePiMean ?? 0) > 1.4 && !medvedevDoppler.some((d) => d.marker === "uterinePiMean" && d.flag === "high")) {
    alerts.push("⚠️ PI маточных артерий повышен (>95 перц.)");
  }
  for (const row of medvedevDoppler) {
    if (row.marker === "uterinePiMean" && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} выше 95-го перцентиля (~${row.percentile ?? ">95"}-й, Прил. 36)`);
    }
    if (row.marker === "mcaPi" && row.flag === "low") {
      alerts.push(`⚠️ ${row.label} ниже 5-го перцентиля (~${row.percentile ?? "<5"}-й, централизация, Прил. 39)`);
    }
    if (row.marker === "mcaPi" && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} выше 95-го перцентиля (~${row.percentile ?? ">95"}-й, Прил. 39)`);
    }
    if (row.marker === "mcaPsv" && row.flag === "high") {
      alerts.push(
        `⚠️ ${row.label} >1,5 MoM (${row.mom?.toFixed(2) ?? ">1.5"} MoM — подозрение на анемию плода, Прил. 38)`,
      );
    }
    if (row.marker === "dvPi" && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} повышен (~${row.percentile ?? ">95"}-й перц.)`);
    }
    if (row.marker === "uaRi" && row.flag === "high") {
      alerts.push(`⚠️ ${row.label} выше 95-го перцентиля (~${row.percentile ?? ">95"}-й, Прил. 37)`);
    }
  }
  if (input.mcaPi != null && medvedevDoppler.length === 0 && input.mcaPi < 1.2) {
    alerts.push("⚠️ PI СМА снижен (централизация кровотока)");
  }
  if ((input.uaPi ?? 0) > 1.3 && !medvedevDoppler.some((d) => d.marker === "uaRi")) {
    alerts.push("⚠️ PI артерии пуповины повышен (для Медведева введите ИР АП — Прил. 37)");
  }

  for (const marker of medvedevBiometry) {
    if (marker.marker === "ac" && marker.flag === "low") {
      alerts.push(`⚠️ AC ниже 5-го перцентиля (~${marker.percentile ?? "<5"}-й, риск ЗВУР)`);
    }
    if (marker.marker === "ac" && marker.flag === "high") {
      alerts.push(`⚠️ AC выше 95-го перцентиля (~${marker.percentile ?? ">95"}-й, крупный плод)`);
    }
    if (marker.marker === "efw" && marker.flag === "low") {
      alerts.push(`⚠️ EFW ниже 5-го перцентиля (~${marker.percentile ?? "<5"}-й, риск ЗВУР)`);
    }
    if (marker.marker === "efw" && marker.flag === "high") {
      alerts.push(`⚠️ EFW выше 95-го перцентиля (~${marker.percentile ?? ">95"}-й)`);
    }
    if (
      (marker.marker === "bpd" || marker.marker === "hc" || marker.marker === "fl") &&
      marker.flag === "low"
    ) {
      alerts.push(`⚠️ ${marker.label} ниже 5-го перцентиля (~${marker.percentile ?? "<5"}-й)`);
    }
    if (marker.marker === "thymusPerimeter" && marker.flag === "low") {
      alerts.push(`⚠️ Периметр тимуса ниже 5-го перцентиля (~${marker.percentile ?? "<5"}-й, Прил. 14)`);
    }
    if (marker.marker === "leftAtrium" && marker.flag === "high") {
      alerts.push(`⚠️ Левое предсердие расширено (~${marker.percentile ?? ">95"}-й, Shapiro)`);
    }
    if (marker.marker === "rightAtrium" && marker.flag === "high") {
      alerts.push(`⚠️ Правое предсердие расширено (~${marker.percentile ?? ">95"}-й, Shapiro)`);
    }
    if (marker.marker === "aorta" && (marker.flag === "low" || marker.flag === "high")) {
      alerts.push(`⚠️ Диаметр аорты вне нормы (~${marker.percentile ?? "?"}-й перц., Прил. 20)`);
    }
  }

  const acPc =
    acMarker?.percentile ??
    calcPercentile("ac", input.ac, input.gaWeeksByLmp, mode, input.gaDaysByLmp);
  const efwPc =
    efwMarker?.percentile ??
    calcPercentile("efw", efw ?? undefined, input.gaWeeksByLmp, mode, input.gaDaysByLmp);

  if (mode === "quick") {
    if (acPc !== null && acPc < 10) alerts.push("⚠️ AC ниже 10 перцентиля (быстрая оценка)");
    if (efwPc !== null && efwPc < 10) alerts.push("⚠️ EFW ниже 10 перцентиля (быстрая оценка)");
  }

  if (alerts.some((x) => x.includes("централизация") || x.includes("СМА")) && (input.uaPi ?? 0) > 1.3) {
    hypotheses.push("Подозрение на гипоксию плода (централизация кровотока).");
    hypotheses.push("Рассмотреть КТГ, решение о госпитализации и допплер-контроль в краткий интервал.");
  }
  if (alerts.some((x) => x.includes("Вентрикуломегалия") || x.includes("Лат. желудочки"))) {
    hypotheses.push("Проверить corpus callosum, TORCH-инфекции, обсудить генетическую консультацию.");
  }

  const percentileNotes = medvedevBiometry
    .filter((m) => m.percentile !== undefined && m.value !== undefined)
    .map((m) => `${m.label.split(" (")[0]} ~${m.percentile}-й перц.`)
    .join("; ");

  const nextPrompt = !input.bpd || !input.hc || !input.ac || !input.fl ? "Введите обязательную фетометрию (BPD/OFD/HC/AC/FL)." : "Проверьте анатомические структуры и допплер.";
  const gaText = `${input.gaWeeksByLmp ?? "?"} нед ${input.gaDaysByLmp ?? "?"} д`;
  const trimesterWord = trimester === "second" ? "II скрининг" : "III скрининг";
  const conclusion =
    alerts.length === 0
      ? `${trimesterWord}. Беременность ${gaText}. Один живой плод. Фетометрические показатели соответствуют сроку беременности. Данных за врожденные пороки развития не выявлено. Показатели маточно-плацентарного и плодово-плацентарного кровотока в пределах нормы.${efw ? ` Предполагаемая масса плода: ~${efw} г.` : ""}${percentileNotes ? ` ${percentileNotes}.` : ""}`
      : `${trimesterWord}. Беременность ${gaText}. Выявлены отклонения: ${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}.${efw ? ` Предполагаемая масса плода: ~${efw} г.` : ""}${percentileNotes ? ` ${percentileNotes}.` : ""}`;
  const recommendations =
    alerts.length === 0
      ? trimester === "second"
        ? ["Плановый контроль УЗИ в 27–28 недель.", "Допплер/КТГ по показаниям."]
        : ["Плановый контроль по сроку.", "Допплер/КТГ по показаниям."]
      : ["Консультация акушера-гинеколога.", "Повторный экспертный УЗ-контроль и допплер в динамике.", "При признаках гипоксии: КТГ и решение вопроса о госпитализации."];
  return { nextPrompt, alerts, hypotheses, conclusion, recommendations, visualHints, missingQuestions, medvedevBiometry, medvedevDoppler, medvedevPlacentaAfi };
}

export function analyzeDoppler(input: {
  piRight?: number;
  piLeft?: number;
  piUmb?: number;
  uaRi?: number;
  piMca?: number;
  mcaPsv?: number;
  dvPi?: number;
  gaWeeks?: number;
  gaDays?: number;
}): AssistantOutput {
  const missingQuestions: string[] = [];
  if (typeof input.piRight !== "number") missingQuestions.push("Введите PI правой маточной артерии.");
  if (typeof input.piLeft !== "number") missingQuestions.push("Введите PI левой маточной артерии.");
  if (typeof input.uaRi !== "number" && typeof input.piUmb !== "number") {
    missingQuestions.push("Введите ИР артерии пуповины (RI, Прил. 37) или PI UA.");
  }
  if (typeof input.piMca !== "number") missingQuestions.push("Введите PI среднемозговой артерии.");
  if (input.gaWeeks === undefined) missingQuestions.push("Укажите срок (нед) для перцентилей UtA/DV/UA.");
  const alerts: string[] = [];
  const hypotheses: string[] = [];
  const visualHints = ["Маточные артерии: правая/левая PI", "АП: RI (Прил. 37)", "СМА PI / PSV", "Венозный проток PI"];

  const gaDaysTotal =
    input.gaWeeks !== undefined ? input.gaWeeks * 7 + (input.gaDays ?? 0) : null;
  const medvedevDoppler = assessMedvedevDoppler({
    gaDaysTotal,
    dvPi: input.dvPi,
    uterinePiRight: input.piRight,
    uterinePiLeft: input.piLeft,
    mcaPi: input.piMca,
    mcaPsv: input.mcaPsv,
    uaRi: input.uaRi,
  });

  for (const row of medvedevDoppler) {
    if (row.flag === "high") {
      const refNote =
        row.marker === "mcaPsv"
          ? `>1,5 MoM (${row.mom?.toFixed(2) ?? ">1.5"} MoM, анемия плода, Прил. 38)`
          : row.marker === "dvPi" && row.label.includes("II/III")
            ? "выше 95-го перцентиля (Прил. 41)"
            : row.marker === "dvPi"
              ? "выше референса FMF (Прил. 40)"
              : "выше 95-го перцентиля";
      alerts.push(`⚠️ ${row.label} — ${refNote}${row.percentile !== undefined ? ` (~${row.percentile}-й)` : ""}`);
    }
    if (row.marker === "mcaPi" && row.flag === "low") {
      alerts.push(`⚠️ ${row.label} ниже 5-го перцентиля (~${row.percentile ?? "<5"}-й, централизация)`);
    }
  }

  if (medvedevDoppler.length === 0) {
    if ((input.piRight ?? 0) > 1.4 || (input.piLeft ?? 0) > 1.4) {
      alerts.push("⚠️ Риск преэклампсии (маточные PI >1,4 — укажите срок для перцентиля Медведева)");
    }
  }

  if ((input.piMca ?? 99) < 1.2 && !medvedevDoppler.some((d) => d.marker === "mcaPi")) {
    alerts.push("⚠️ Централизация кровотока (PI СМА снижен)");
  }
  const uaHigh = medvedevDoppler.some((d) => d.marker === "uaRi" && d.flag === "high");
  const mcaLow = medvedevDoppler.some((d) => d.marker === "mcaPi" && d.flag === "low");
  if (uaHigh && mcaLow) {
    hypotheses.push("Подозрение на гипоксию плода: повышение ИР АП + снижение PI СМА (централизация).");
  } else if ((input.piUmb ?? 0) > 1.3 && (input.piMca ?? 99) < 1.2) {
    hypotheses.push("Подозрение на гипоксию плода: повышение PI АП + снижение PI СМА.");
  }

  const percentileNotes = medvedevDoppler
    .filter((m) => m.percentile !== undefined)
    .map((m) => `${m.label}: ~${m.percentile}-й перц.`)
    .join("; ");

  return {
    nextPrompt: "Введите PI правой/левой маточных артерий, PI АП и PI СМА.",
    alerts,
    hypotheses,
    conclusion:
      alerts.length === 0
        ? `Допплерометрические показатели в пределах ожидаемых значений.${percentileNotes ? ` ${percentileNotes}.` : ""}`
        : `Допплер: выявлены отклонения (${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}).${percentileNotes ? ` ${percentileNotes}.` : ""}`,
    recommendations:
      alerts.length === 0
        ? ["Плановый контроль по сроку."]
        : ["Динамический контроль допплера и КТГ по показаниям.", "Консультация акушера-гинеколога."],
    visualHints,
    missingQuestions,
    medvedevDoppler,
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
