import type { Vector3 } from "three";
import { cylindricalR, radialDepth01 } from "./profile";

export type AnatomyLayerId = "endometrium" | "junctional_zone" | "myometrium" | "subserosa" | "serosa" | "cervix";

export const ANATOMY_LAYER_LABEL_RU: Record<AnatomyLayerId, string> = {
  endometrium: "Эндометрий",
  junctional_zone: "Переходная зона (JZ)",
  myometrium: "Миометрий",
  subserosa: "Подсерозный слой",
  serosa: "Сероза",
  cervix: "Шейка матки",
};

export type UterusHitResult = {
  figoType: number;
  layerId: AnatomyLayerId;
  layerLabelRu: string;
  depth01: number;
  tooltipEn: string;
  tooltipRu: string;
  /** Образовательная группа по запросу ТЗ */
  bucketRu: "Субмукозная" | "Интрамуральная" | "Субсерозная" | "Иная";
};

function layerFromDepth(depth01: number, y: number): { id: AnatomyLayerId; ru: string } {
  if (y < -1.28) return { id: "cervix", ru: ANATOMY_LAYER_LABEL_RU.cervix };
  if (depth01 < 0.1) return { id: "endometrium", ru: ANATOMY_LAYER_LABEL_RU.endometrium };
  if (depth01 < 0.22) return { id: "junctional_zone", ru: ANATOMY_LAYER_LABEL_RU.junctional_zone };
  if (depth01 < 0.72) return { id: "myometrium", ru: ANATOMY_LAYER_LABEL_RU.myometrium };
  if (depth01 < 0.9) return { id: "subserosa", ru: ANATOMY_LAYER_LABEL_RU.subserosa };
  return { id: "serosa", ru: ANATOMY_LAYER_LABEL_RU.serosa };
}

function figoFromDepth(depth01: number, y: number, pedunculated: boolean): number {
  if (y < -1.28) return 8;

  if (depth01 < 0.12) {
    if (pedunculated) return 0;
    return depth01 < 0.055 ? 1 : 2;
  }
  if (depth01 < 0.28) return 3;
  if (depth01 < 0.58) return 4;
  if (depth01 < 0.82) return 5;

  if (pedunculated && depth01 > 0.88) return 7;
  return 6;
}

/** Образовательная группировка по ТЗ: 0–2 субмукозные, 3–5 интрамуральные, 6–7 субсерозные. */
export function figoEducationalBucket(figo: number): UterusHitResult["bucketRu"] {
  if (figo === 8) return "Иная";
  if (figo <= 2) return "Субмукозная";
  if (figo <= 5) return "Интрамуральная";
  return "Субсерозная";
}

const FIGO_LABEL_EN: Record<number, string> = {
  0: "FIGO 0 — pedunculated submucosal (intracavitary)",
  1: "FIGO 1 — submucosal, <50% intramural component",
  2: "FIGO 2 — submucosal, ≥50% intramural component",
  3: "FIGO 3 — contacts endometrium, 100% intramural",
  4: "FIGO 4 — intramural, no endometrium/serosa contact",
  5: "FIGO 5 — subserosal, ≥50% intramural component",
  6: "FIGO 6 — subserosal, <50% intramural component",
  7: "FIGO 7 — pedunculated subserosal",
  8: "FIGO 8 — other (including cervical)",
};

const FIGO_LABEL_RU: Record<number, string> = {
  0: "FIGO 0 — субмукозный на ножке (интракавитарно)",
  1: "FIGO 1 — субмукозный, <50% интрамурально",
  2: "FIGO 2 — субмукозный, ≥50% интрамурально",
  3: "FIGO 3 — контакт с эндометрием, 100% интрамурально",
  4: "FIGO 4 — интрамуральный без контакта с эндометрием и серозой",
  5: "FIGO 5 — субсерозный, ≥50% интрамурально",
  6: "FIGO 6 — субсерозный, <50% интрамурально",
  7: "FIGO 7 — субсерозный на ножке",
  8: "FIGO 8 — иная локализация (включая шеечную)",
};

export function buildUterusHitFromParts(input: {
  figoType: number;
  layerId: AnatomyLayerId;
  layerLabelRu: string;
  depth01: number;
  note?: string;
}): UterusHitResult {
  const { figoType, layerId, layerLabelRu, depth01, note } = input;
  const noteSeg = note ? ` · ${note}` : "";
  const figoEn = FIGO_LABEL_EN[figoType] ?? `FIGO ${figoType}`;
  const figoRu = FIGO_LABEL_RU[figoType] ?? `FIGO ${figoType}`;
  return {
    figoType,
    layerId,
    layerLabelRu,
    depth01,
    tooltipEn: `${figoEn} · ${layerLabelRu}${noteSeg} · depth≈${(depth01 * 100).toFixed(0)}%`,
    tooltipRu: `${figoRu} · ${layerLabelRu}${noteSeg} · глубина≈${(depth01 * 100).toFixed(0)}%`,
    bucketRu: figoEducationalBucket(figoType),
  };
}

export function analyzeUterusHit(worldPoint: Vector3, pedunculated: boolean): UterusHitResult {
  const y = worldPoint.y;
  const r = cylindricalR(worldPoint.x, worldPoint.z);
  const depth01 = radialDepth01(r, y);
  const layer = layerFromDepth(depth01, y);
  const figo = figoFromDepth(depth01, y, pedunculated);
  return buildUterusHitFromParts({
    figoType: figo,
    layerId: layer.id,
    layerLabelRu: layer.ru,
    depth01,
  });
}
