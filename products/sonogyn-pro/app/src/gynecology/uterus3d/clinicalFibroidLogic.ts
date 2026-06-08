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
};

/** Смещает радиальную позицию узла к полости (0–1): усиливает субмукозный компонент в учебной модели */
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

/** Гауссовы «вклады» по глубине стенки → три компонента, нормированы до 100% */
export function depthToComponentPercents(depth01: number): Pick<FibroidClinicalMetrics, "submucosalPct" | "intramuralPct" | "subserosalPct"> {
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
  let segRu = "Средний отдел тела матки";
  let segEn = "Mid uterine segment";
  if (y > 0.52) {
    segRu = "Дно / верхний отдел";
    segEn = "Fundal / upper segment";
  } else if (y < -0.95) {
    segRu = "Нижний сегмент / переход к шейке";
    segEn = "Lower uterine segment / isthmic region";
  } else if (y < -0.35 && y >= -0.95) {
    segRu = "Нижняя треть тела";
    segEn = "Lower third of corpus";
  }

  const ax = Math.abs(local.x);
  const az = Math.abs(local.z);
  let wallRu = "Боковая стенка";
  let wallEn = "Lateral wall";
  if (az >= ax * 0.72) {
    if (local.z > 0.08) {
      wallRu = "Передняя стенка";
      wallEn = "Anterior wall";
    } else if (local.z < -0.08) {
      wallRu = "Задняя стенка";
      wallEn = "Posterior wall";
    }
  } else if (local.x > 0.12) {
    wallRu = "Правая боковая стенка";
    wallEn = "Right lateral wall";
  } else if (local.x < -0.12) {
    wallRu = "Левая боковая стенка";
    wallEn = "Left lateral wall";
  }

  return {
    ru: `${wallRu}, ${segRu}`,
    en: `${wallEn}, ${segEn}`,
  };
}

const FIGO_SHORT_EN: Record<number, string> = {
  0: "FIGO 0 pedunculated submucosal (intracavitary)",
  1: "FIGO 1 submucosal fibroid <50% intramural component",
  2: "FIGO 2 submucosal fibroid ≥50% intramural component",
  3: "FIGO 3 contacting endometrium, entirely intramural",
  4: "FIGO 4 intramural, no endometrial or serosal contact",
  5: "FIGO 5 subserosal ≥50% intramural component",
  6: "FIGO 6 subserosal <50% intramural component",
  7: "FIGO 7 pedunculated subserosal",
  8: "FIGO 8 other (including cervical)",
};

const FIGO_SHORT_RU: Record<number, string> = {
  0: "FIGO 0 субмукозная на ножке (интракавитарно)",
  1: "FIGO 1 субмукозная миома <50% интрамурального компонента",
  2: "FIGO 2 субмукозная миома ≥50% интрамурального компонента",
  3: "FIGO 3 контакт с эндометрием, полностью интрамуральная",
  4: "FIGO 4 интрамуральная без контакта с эндометрием и серозой",
  5: "FIGO 5 субсерозная ≥50% интрамурального компонента",
  6: "FIGO 6 субсерозная <50% интрамурального компонента",
  7: "FIGO 7 субсерозная на ножке",
  8: "FIGO 8 иная локализация (включая шейку)",
};

export function computeFibroidClinicalMetrics(
  local: Vector3,
  pedunculated: boolean,
  cavityBias01: number,
): FibroidClinicalMetrics {
  const biased = applyCavityBias(local, cavityBias01);
  const hit = analyzeUterusHit(biased, pedunculated);
  const r = cylindricalR(biased.x, biased.z);
  const depth01 = radialDepth01(r, biased.y);
  const pct = depthToComponentPercents(depth01);
  const loc = describeFibroidLocalization(biased);

  const figoLineEn = FIGO_SHORT_EN[hit.figoType] ?? `FIGO ${hit.figoType}`;
  const figoLineRu = FIGO_SHORT_RU[hit.figoType] ?? `FIGO ${hit.figoType}`;

  const pctEn = `Submucosal ~${pct.submucosalPct}% · Intramural ~${pct.intramuralPct}% · Subserosal ~${pct.subserosalPct}%`;
  const pctRu = `Субмукозный компонент ~${pct.submucosalPct}% · Интрамуральный ~${pct.intramuralPct}% · Субсерозный ~${pct.subserosalPct}%`;

  return {
    figoType: hit.figoType,
    ...pct,
    localizationRu: loc.ru,
    localizationEn: loc.en,
    summaryEn: `${figoLineEn}. ${loc.en}. ${pctEn}.`,
    summaryRu: `${figoLineRu}. ${loc.ru}. ${pctRu}.`,
  };
}
