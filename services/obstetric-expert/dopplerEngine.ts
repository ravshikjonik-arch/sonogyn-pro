import {
  interpretUterinePi,
  pulsatilityIndex,
  resistanceIndex,
  type DopplerVelocities,
} from "../../packages/medical-calculations/src/doppler";

import {
  cprThreshold,
  getDvPiBand,
  getMcaPiBand,
  getUaPiBand,
  getUtaPiBand,
  percentileFromBand,
} from "./dopplerReference";
import type { DopplerData, GestationalAgeInput } from "./types";

export type DopplerVessel = "UA" | "MCA" | "DV" | "UTA";

export type DopplerClassification = "normal" | "elevated" | "reduced" | "critical" | "unknown";

export type VesselDopplerResult = {
  vessel: DopplerVessel;
  labelRu: string;
  pi?: number;
  ri?: number;
  sdRatio?: number;
  percentile?: number;
  classification: DopplerClassification;
  interpretationRu: string;
};

export type CprResult = {
  value: number;
  threshold: number;
  classification: DopplerClassification;
  interpretationRu: string;
};

export type FgrDopplerPattern =
  | "none"
  | "ua_elevated"
  | "brain_sparing"
  | "redistribution"
  | "critical_dv"
  | "uterine_notching"
  | "unknown";

export type DopplerAssessmentInput = {
  gestationalAge: GestationalAgeInput;
  /** Один объект или массив по сосудам */
  dopplerData?: DopplerData | DopplerData[];
  /** Плоские поля (альтернатива dopplerData) */
  uaPi?: number;
  mcaPi?: number;
  dvPi?: number;
  utaPi?: number;
  utaPiLeft?: number;
  utaPiRight?: number;
  uaRi?: number;
  mcaRi?: number;
  /** I трим.: a-wave венозного протока */
  dvAWave?: "normal" | "absent" | "reversed";
  /** Скорости для расчёта PI/RI если PI не задан */
  uaVelocities?: DopplerVelocities;
  mcaVelocities?: DopplerVelocities;
};

export type DopplerAssessmentOutput = {
  gestationalAgeWeeks: number;
  vessels: VesselDopplerResult[];
  cpr?: CprResult;
  fgrPattern: FgrDopplerPattern;
  summaryRu: string;
  recommendations: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "Интерпретация допплера — ориентир по ISUOG/локальному протоколу. " +
  "Не заменяет клиническое решение. Интерпретация — специалист.";

function gaToWeeks(ga: GestationalAgeInput): number | null {
  if (ga.weeks == null || !Number.isFinite(ga.weeks)) return null;
  return ga.weeks + (ga.days ?? 0) / 7;
}

function flattenDoppler(input: DopplerAssessmentInput): Map<DopplerVessel, DopplerData> {
  const map = new Map<DopplerVessel, DopplerData>();
  const items = input.dopplerData
    ? Array.isArray(input.dopplerData)
      ? input.dopplerData
      : [input.dopplerData]
    : [];

  for (const d of items) {
    const v = (d.vessel?.toUpperCase() ?? "") as DopplerVessel;
    if (v === "UA" || v === "MCA" || v === "DV" || v === "UTA") map.set(v, d);
  }

  if (input.uaPi != null || input.uaRi != null) {
    map.set("UA", { ...map.get("UA"), vessel: "UA", pi: input.uaPi ?? map.get("UA")?.pi, ri: input.uaRi ?? map.get("UA")?.ri });
  }
  if (input.mcaPi != null || input.mcaRi != null) {
    map.set("MCA", { ...map.get("MCA"), vessel: "MCA", pi: input.mcaPi ?? map.get("MCA")?.pi, ri: input.mcaRi ?? map.get("MCA")?.ri });
  }
  if (input.dvPi != null) {
    map.set("DV", { ...map.get("DV"), vessel: "DV", pi: input.dvPi });
  }
  const utaMean =
    input.utaPi ??
    (input.utaPiLeft != null && input.utaPiRight != null
      ? (input.utaPiLeft + input.utaPiRight) / 2
      : input.utaPiLeft ?? input.utaPiRight);
  if (utaMean != null) {
    map.set("UTA", { ...map.get("UTA"), vessel: "UTA", pi: utaMean });
  }

  if (input.uaVelocities && !map.get("UA")?.pi) {
    const pi = pulsatilityIndex(input.uaVelocities);
    const ri = resistanceIndex(input.uaVelocities);
    map.set("UA", { vessel: "UA", pi: pi ?? undefined, ri: ri ?? undefined });
  }
  if (input.mcaVelocities && !map.get("MCA")?.pi) {
    const pi = pulsatilityIndex(input.mcaVelocities);
    const ri = resistanceIndex(input.mcaVelocities);
    map.set("MCA", { vessel: "MCA", pi: pi ?? undefined, ri: ri ?? undefined });
  }

  return map;
}

function classifyPi(
  pi: number,
  band: { p5: number; p50: number; p95: number } | null,
  vessel: DopplerVessel,
): { percentile?: number; classification: DopplerClassification; interpretationRu: string } {
  if (!band) {
    return { classification: "unknown", interpretationRu: `${vessel}: нет референса для срока` };
  }
  const percentile = percentileFromBand(pi, band);
  if (percentile >= 95) {
    return {
      percentile,
      classification: "elevated",
      interpretationRu: `ПИ повышен (~${percentile}-й перц.)`,
    };
  }
  if (percentile <= 5) {
    return {
      percentile,
      classification: "reduced",
      interpretationRu:
        vessel === "MCA"
          ? `ПИ СМА снижен (~${percentile}-й перц.) — возможен brain sparing`
          : `ПИ ниже p5 (~${percentile}-й перц.)`,
    };
  }
  return {
    percentile,
    classification: "normal",
    interpretationRu: `В пределах референса (~${percentile}-й перц., медиана ${band.p50.toFixed(2)})`,
  };
}

function assessVessel(
  vessel: DopplerVessel,
  data: DopplerData | undefined,
  gaWeeks: number,
  dvAWave?: DopplerAssessmentInput["dvAWave"],
): VesselDopplerResult | null {
  const labels: Record<DopplerVessel, string> = {
    UA: "Пуповинная артерия (UA)",
    MCA: "Средняя мозговая артерия (MCA)",
    DV: "Венозный проток (DV)",
    UTA: "Маточные артерии (mean PI)",
  };

  if (vessel === "DV" && dvAWave && dvAWave !== "normal") {
    return {
      vessel: "DV",
      labelRu: labels.DV,
      pi: data?.pi,
      classification: "critical",
      interpretationRu:
        dvAWave === "reversed"
          ? "Инвертированная / отсутствующая a-волна DV — критический признак"
          : "Отсутствие a-волны DV — патологический поток",
    };
  }

  const pi = data?.pi;
  if (pi == null || !Number.isFinite(pi)) return null;

  let band = null;
  if (vessel === "UA") band = getUaPiBand(gaWeeks);
  if (vessel === "MCA") band = getMcaPiBand(gaWeeks);
  if (vessel === "DV") band = getDvPiBand(gaWeeks);
  if (vessel === "UTA") band = getUtaPiBand(gaWeeks);

  const assessed = classifyPi(pi, band, vessel);

  if (vessel === "UTA") {
    const utInterp = interpretUterinePi(pi, gaWeeks);
    if (utInterp === "elevated" && assessed.classification === "normal") {
      assessed.classification = "elevated";
      assessed.interpretationRu = `ПИ маточных артерий повышен для ${Math.round(gaWeeks)} нед`;
    }
  }

  if (vessel === "DV" && pi >= (band?.p95 ?? 0.95)) {
    assessed.classification = "critical";
    assessed.interpretationRu = `ПИ DV повышен (~${assessed.percentile ?? ">95"}-й перц.) — риск декомпенсации`;
  }

  return {
    vessel,
    labelRu: labels[vessel],
    pi,
    ri: data?.ri,
    sdRatio: data?.sdRatio,
    percentile: assessed.percentile,
    classification: assessed.classification,
    interpretationRu: assessed.interpretationRu,
  };
}

function detectFgrPattern(
  vessels: VesselDopplerResult[],
  cpr?: CprResult,
): FgrDopplerPattern {
  const ua = vessels.find((v) => v.vessel === "UA");
  const mca = vessels.find((v) => v.vessel === "MCA");
  const dv = vessels.find((v) => v.vessel === "DV");
  const uta = vessels.find((v) => v.vessel === "UTA");

  if (dv?.classification === "critical") return "critical_dv";
  if (cpr?.classification === "reduced" || cpr?.classification === "critical") return "redistribution";
  if (ua?.classification === "elevated" && mca?.classification === "reduced") return "brain_sparing";
  if (ua?.classification === "elevated") return "ua_elevated";
  if (uta?.classification === "elevated") return "uterine_notching";
  if (!vessels.length) return "unknown";
  return "none";
}

function buildRecommendations(
  pattern: FgrDopplerPattern,
  vessels: VesselDopplerResult[],
  cpr?: CprResult,
  gaWeeks?: number,
): string[] {
  const recs: string[] = [];
  if (pattern === "critical_dv") {
    recs.push("Критический DV: срочная консультация MFM; решение о сроке родоразрешения по протоколу");
  }
  if (pattern === "redistribution" || pattern === "brain_sparing") {
    recs.push("Паттерн redistribution/brain sparing: серийная биометрия + допплер q1–2 нед");
    recs.push("Оценить CTG / BPP по сроку; стероидная профилактика по показаниям");
  }
  if (pattern === "ua_elevated") {
    recs.push("Повышенный UA-PI: исключить FGR; контроль роста и AFI");
  }
  if (pattern === "uterine_notching") {
    recs.push("Повышенный PI маточных артерий: риск ПЭ/FGR — наблюдение по протоколу");
  }
  if (cpr && cpr.classification !== "normal") {
    recs.push(`CPR ${cpr.value.toFixed(2)} < порога ${cpr.threshold}: дополнительный маркер гипоксии`);
  }
  if (gaWeeks != null && gaWeeks < 14 && vessels.some((v) => v.vessel === "DV" && v.classification === "critical")) {
    recs.push("I трим.: патологический DV — включить в комбинированный риск анеуплоидий (FMF)");
  }
  if (!recs.length) {
    recs.push("Допплер-профиль без критических отклонений — продолжить наблюдение по протоколу");
  }
  return [...new Set(recs)].slice(0, 8);
}

function buildSummary(
  gaWeeks: number,
  vessels: VesselDopplerResult[],
  cpr?: CprResult,
  pattern?: FgrDopplerPattern,
): string {
  const parts = vessels
    .filter((v) => v.pi != null)
    .map((v) => `${v.vessel} PI ${v.pi!.toFixed(2)} (${v.interpretationRu.split("—")[0].trim()})`);
  if (cpr) parts.push(`CPR ${cpr.value.toFixed(2)} (порог ${cpr.threshold})`);
  const patternRu: Record<FgrDopplerPattern, string> = {
    none: "без паттерна FGR",
    ua_elevated: "UA-PI ↑",
    brain_sparing: "brain sparing",
    redistribution: "redistribution (CPR ↓)",
    critical_dv: "критический DV",
    uterine_notching: "UtA PI ↑",
    unknown: "",
  };
  return [`${Math.floor(gaWeeks)}+${Math.round((gaWeeks % 1) * 7)} нед.`, parts.join("; "), patternRu[pattern ?? "unknown"]]
    .filter(Boolean)
    .join(". ");
}

/**
 * Этап 5 — оценка допплера: UA/MCA/DV/UTA, PI/RI/S/D, CPR, паттерн FGR.
 */
export function assessFetalDoppler(input: DopplerAssessmentInput): DopplerAssessmentOutput {
  const gaWeeks = gaToWeeks(input.gestationalAge);
  if (gaWeeks == null) throw new Error("gestationalAge.weeks обязателен");

  const flat = flattenDoppler(input);
  const vessels: VesselDopplerResult[] = [];

  for (const vessel of ["UA", "MCA", "DV", "UTA"] as DopplerVessel[]) {
    const r = assessVessel(vessel, flat.get(vessel), gaWeeks, input.dvAWave);
    if (r) vessels.push(r);
  }

  let cpr: CprResult | undefined;
  const uaPi = flat.get("UA")?.pi;
  const mcaPi = flat.get("MCA")?.pi;
  if (uaPi != null && mcaPi != null && uaPi > 0) {
    const value = Math.round((mcaPi / uaPi) * 100) / 100;
    const threshold = cprThreshold(gaWeeks);
    const classification: DopplerClassification =
      value < threshold * 0.9 ? "critical" : value < threshold ? "reduced" : "normal";
    cpr = {
      value,
      threshold,
      classification,
      interpretationRu:
        classification === "normal"
          ? `CPR в норме (≥ ${threshold})`
          : `CPR снижен (< ${threshold}) — центральная редистрибуция`,
    };
  }

  const fgrPattern = detectFgrPattern(vessels, cpr);
  const recommendations = buildRecommendations(fgrPattern, vessels, cpr, gaWeeks);

  return {
    gestationalAgeWeeks: gaWeeks,
    vessels,
    cpr,
    fgrPattern,
    summaryRu: buildSummary(gaWeeks, vessels, cpr, fgrPattern),
    recommendations,
    disclaimer: DISCLAIMER,
  };
}

export type { GestationalAgeInput, DopplerData };
