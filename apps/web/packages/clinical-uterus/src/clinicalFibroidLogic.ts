import { Vector3 } from "three";
import * as THREE from "three";
import { analyzeUterusHit } from "./figoHitMapping";
import { cylindricalR, innerRadiusAtY, outerRadiusAtY, radialDepth01 } from "./profile";

export type FibroidClinicalMetrics = {
  figoType: number;
  submucosalPct: number;
  intramuralPct: number;
  subserosalPct: number;
  localizationRu: string;
  localizationEn: string;
  summaryEn: string;
  summaryRu: string;
  layerLabelRu: string;
};

export function applyCavityBias(local: Vector3, cavityBias01: number): Vector3 {
  if (cavityBias01 <= 0) return local.clone();
  const y = local.y;
  const r = cylindricalR(local.x, local.z);
  if (r < 1e-5) return local.clone();
  const inner = innerRadiusAtY(y);
  const outer = outerRadiusAtY(y);
  const t = THREE.MathUtils.clamp((r - inner) / (outer - inner + 1e-6), 0, 1);
  const biasedT = THREE.MathUtils.clamp(t - cavityBias01 * 0.45, 0, 1);
  const rNew = inner + biasedT * (outer - inner);
  const s = rNew / r;
  return new Vector3(local.x * s, local.y, local.z * s);
}

function gaussian(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
}

export function depthToComponentPercents(depth01: number): Pick<
  FibroidClinicalMetrics,
  "submucosalPct" | "intramuralPct" | "subserosalPct"
> {
  const d = THREE.MathUtils.clamp(depth01, 0, 1);
  const wSm = gaussian(d, 0.05, 0.07) + gaussian(d, 0.14, 0.06) * 0.35;
  const wIm = gaussian(d, 0.42, 0.18) + gaussian(d, 0.62, 0.12) * 0.55;
  const wSs = gaussian(d, 0.92, 0.09) + gaussian(d, 0.78, 0.1) * 0.4;
  const sum = wSm + wIm + wSs + 1e-6;
  const round = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
  let sm = round((wSm / sum) * 100);
  let im = round((wIm / sum) * 100);
  let ss = round((wSs / sum) * 100);
  const drift = 100 - (sm + im + ss);
  im += drift;
  if (im < 0) {
    sm = Math.max(0, sm + im);
    im = 0;
  }
  return { submucosalPct: sm, intramuralPct: im, subserosalPct: ss };
}

export function describeFibroidLocalization(local: Vector3): { ru: string; en: string } {
  const y = local.y;
  let segRu = "средний отдел тела матки";
  if (y > 0.52) segRu = "дно / верхний отдел";
  else if (y < -0.95) segRu = "нижний сегмент / переход к шейке";
  else if (y < -0.35) segRu = "нижняя треть тела";

  const ax = Math.abs(local.x);
  const az = Math.abs(local.z);
  let wallRu = "боковая стенка";
  if (az >= ax * 0.72) {
    if (local.z > 0.08) wallRu = "передняя стенка";
    else if (local.z < -0.08) wallRu = "задняя стенка";
  } else if (local.x > 0.12) wallRu = "правая боковая стенка";
  else if (local.x < -0.12) wallRu = "левая боковая стенка";

  return { ru: `${wallRu}, ${segRu}`, en: wallRu };
}

const FIGO_SHORT_RU: Record<number, string> = {
  0: "FIGO 0 (субмукозная на ножке)",
  1: "FIGO 1 (субмукозная <50% интрамурально)",
  2: "FIGO 2 (субмукозная ≥50% интрамурально)",
  3: "FIGO 3 (контакт с эндометрием, интрамуральная)",
  4: "FIGO 4 (интрамуральная)",
  5: "FIGO 5 (субсерозная ≥50% интрамурально)",
  6: "FIGO 6 (субсерозная <50% интрамурально)",
  7: "FIGO 7 (субсерозная на ножке)",
  8: "FIGO 8 (иная, в т.ч. шейка)",
};

export function computeFibroidClinicalMetrics(
  local: Vector3,
  pedunculated: boolean,
  cavityBias01 = 0,
): FibroidClinicalMetrics {
  const biased = applyCavityBias(local, cavityBias01);
  const hit = analyzeUterusHit(biased, pedunculated);
  const r = cylindricalR(biased.x, biased.z);
  const depth01 = radialDepth01(r, biased.y);
  const pct = depthToComponentPercents(depth01);
  const loc = describeFibroidLocalization(biased);
  const figoLineRu = FIGO_SHORT_RU[hit.figoType] ?? `FIGO ${hit.figoType}`;
  const pctRu = `субмукозный ~${pct.submucosalPct}%, интрамуральный ~${pct.intramuralPct}%, субсерозный ~${pct.subserosalPct}%`;

  return {
    figoType: hit.figoType,
    ...pct,
    localizationRu: loc.ru,
    localizationEn: loc.en,
    layerLabelRu: hit.layerLabelRu,
    summaryRu: `${figoLineRu}, ${loc.ru}. ${pctRu}.`,
    summaryEn: `FIGO ${hit.figoType}, ${loc.en}.`,
  };
}

/** Предлагаемые FIGO при неоднозначности (соседние типы) */
export function suggestFigoAlternatives(figoType: number): number[] {
  if (figoType <= 2) return [figoType, figoType + 1].filter((n) => n <= 2);
  if (figoType === 3) return [2, 3, 4];
  if (figoType === 4) return [3, 4, 5];
  if (figoType <= 6) return [figoType - 1, figoType, figoType + 1].filter((n) => n >= 5 && n <= 6);
  if (figoType === 7) return [6, 7];
  return [7, 8];
}
