import { Vector3 } from "three";
import { computeFibroidClinicalMetrics } from "./clinicalFibroidLogic";
import { CERVIX_Y_MAX } from "./profile";
import { figoFromLesionEllipse } from "./sliceLesionShape";
import { boundsFromStroke, figoFromStroke } from "./sliceStrokeAnalysis";
import type { PathologyAnnotation } from "./pathologyTypes";
import {
  ANATOMY_LAYER_LABEL_RU,
  figoEducationalBucket,
  type AnatomyLayerId,
  type UterusHitResult,
} from "./figoHitMapping";

/** Публичный путь к сагиттальному срезу (веб). */
export const UTERUS_SAGITTAL_SLICE_SRC = "/clinical/uterus-sagittal-slice.png";

export type SliceNorm = [number, number];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Нормализованные координаты на иллюстрации:
 * nx — 0 дно/фундус (слева), 1 шейка (справа);
 * ny — 0 верх (сероза), 1 низ (задняя стенка / низ тела).
 */
export function sliceNormToModelPosition(nx: number, ny: number): [number, number, number] {
  const u = clamp01(nx);
  const v = clamp01(ny);
  const y = 1.42 - u * 2.9;
  const cavityLine = 0.46;
  const x = (v - cavityLine) * 0.95;
  const z = 0.28 + Math.abs(v - cavityLine) * 0.92;
  return [x, y, z];
}

function layerFromSlice(nx: number, ny: number): AnatomyLayerId {
  if (nx > 0.86 || ny > 0.78) return "cervix";
  const cavityBand = ny > 0.38 && ny < 0.58 && nx > 0.12 && nx < 0.78;
  if (cavityBand && ny < 0.48) return "endometrium";
  if (cavityBand) return "junctional_zone";
  if (ny < 0.32) return "serosa";
  if (ny < 0.42) return "subserosa";
  return "myometrium";
}

function depth01FromSlice(nx: number, ny: number): number {
  const cavityNy = 0.47;
  const d = Math.abs(ny - cavityNy);
  if (nx > 0.86) return 0.5;
  return clamp01(d * 1.35);
}

function figoFromSlice(nx: number, ny: number, pedunculated: boolean): number {
  const y = sliceNormToModelPosition(nx, ny)[1];
  if (y < CERVIX_Y_MAX) return 8;
  const depth = depth01FromSlice(nx, ny);
  if (depth < 0.12) {
    if (pedunculated) return 0;
    return depth < 0.055 ? 1 : 2;
  }
  if (depth < 0.28) return 3;
  if (depth < 0.58) return 4;
  if (depth < 0.82) return 5;
  if (pedunculated && depth > 0.88) return 7;
  return 6;
}

const FIGO_TOOLTIP_RU: Record<number, string> = {
  0: "FIGO 0 — субмукозная на ножке",
  1: "FIGO 1 — субмукозная, <50% интрамурального компонента",
  2: "FIGO 2 — субмукозная, ≥50% интрамурального компонента",
  3: "FIGO 3 — интрамуральная, контакт с эндометрием",
  4: "FIGO 4 — интрамуральная",
  5: "FIGO 5 — интрамуральная, контакт с серозой",
  6: "FIGO 6 — субсерозная",
  7: "FIGO 7 — субсерозная на ножке",
  8: "FIGO 8 — прочие (в т.ч. шейка)",
};

export function analyzeSliceHit(nx: number, ny: number, pedunculated = false): UterusHitResult {
  const u = clamp01(nx);
  const v = clamp01(ny);
  const layerId = layerFromSlice(u, v);
  const depth01 = depth01FromSlice(u, v);
  const figoType = figoFromSlice(u, v, pedunculated);
  const layerLabelRu = ANATOMY_LAYER_LABEL_RU[layerId];
  const bucketRu = figoEducationalBucket(figoType);
  const zone =
    u < 0.14
      ? "дно матки"
      : u > 0.84
        ? "шейка матки"
        : v < 0.36
          ? "передняя/верхняя стенка"
          : v > 0.62
            ? "задняя стенка"
            : "тело матки";

  return {
    figoType,
    layerId,
    layerLabelRu,
    depth01,
    tooltipEn: FIGO_TOOLTIP_RU[figoType] ?? `FIGO ${figoType}`,
    tooltipRu: `${FIGO_TOOLTIP_RU[figoType] ?? `FIGO ${figoType}`} · ${zone}`,
    bucketRu,
  };
}

export function modelPositionToSliceNorm(position: [number, number, number]): SliceNorm {
  const [x, y] = position;
  const nx = clamp01((1.42 - y) / 2.9);
  const ny = clamp01(0.46 + x / 0.95);
  return [nx, ny];
}

export function enrichAnnotationFromSlice(
  a: PathologyAnnotation,
  pedunculatedForHit = false,
): PathologyAnnotation {
  const ped = pedunculatedForHit || a.pedunculated === true;
  const strokeCenter = a.sliceStroke?.points.length ? boundsFromStroke(a.sliceStroke.points) : null;
  const center = strokeCenter ?? a.sliceShape?.ellipse ?? null;
  const norm: SliceNorm = strokeCenter
    ? [strokeCenter.cx, strokeCenter.cy]
    : center && "cx" in center
      ? [center.cx, center.cy]
      : (a.sliceNorm ?? modelPositionToSliceNorm(a.position));
  const hit = analyzeSliceHit(norm[0], norm[1], ped);
  const local = new Vector3(...sliceNormToModelPosition(norm[0], norm[1]));

  if (a.type !== "myoma") {
    return {
      ...a,
      sliceNorm: norm,
      position: [local.x, local.y, local.z],
      layerLabelRu: hit.layerLabelRu,
      localizationRu: hit.tooltipRu.split("·").pop()?.trim() ?? hit.layerLabelRu,
    };
  }

  const m = computeFibroidClinicalMetrics(local, a.pedunculated ?? false);
  const figoCalc = a.sliceStroke?.points.length
    ? figoFromStroke(a.sliceStroke.points, ped)
    : a.sliceShape
      ? figoFromLesionEllipse(a.sliceShape.ellipse, ped)
      : (m.figoType ?? hit.figoType);

  return {
    ...a,
    sliceNorm: norm,
    position: [local.x, local.y, local.z],
    layerLabelRu: hit.layerLabelRu,
    localizationRu: m.localizationRu,
    figoType: a.figoOverride ?? figoCalc,
  };
}
