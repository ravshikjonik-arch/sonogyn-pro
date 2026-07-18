/**
 * Определение гибридных/трансмуральных подтипов FIGO по контуру на сагиттальном срезе.
 * Образовательная модель — не заменяет МРТ/соногистерографию.
 */

import type { FigoVariantCode } from "./figoAtlasContent";

export type SliceNormPoint = [number, number];

const ENDO_MIN = 0.38;
const ENDO_MAX = 0.58;
const SEROSA_OUTER = 0.34;
const SEROSA_INNER = 0.64;
const MIN_TRANSVERSE_SPAN = 0.26;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function strokeTouchesEndometrium(points: SliceNormPoint[]): boolean {
  return points.some(([nx, ny]) => nx > 0.1 && nx < 0.82 && ny >= ENDO_MIN && ny <= ENDO_MAX);
}

export function strokeTouchesSerosa(points: SliceNormPoint[]): boolean {
  return points.some(([nx, ny]) => nx > 0.1 && nx < 0.82 && (ny <= SEROSA_OUTER || ny >= SEROSA_INNER));
}

export function strokeWallSpan(points: SliceNormPoint[]): number {
  const ys = points.map((p) => p[1]);
  return clamp01(Math.max(...ys) - Math.min(...ys));
}

export function strokeHasSubmucosalDominance(points: SliceNormPoint[]): boolean {
  const cavityPts = points.filter(([nx, ny]) => ny >= ENDO_MIN && ny <= 0.52 && nx > 0.12 && nx < 0.78);
  return cavityPts.length >= Math.max(2, Math.floor(points.length * 0.2));
}

/**
 * Возвращает вариант 1–5 / 1–6 / 2–5 / 2–6 / 3–5,
 * если контур пересекает стенку от эндометрия до серозы.
 */
export function detectFigoVariantFromStroke(
  points: SliceNormPoint[],
  primaryFigo: number,
): FigoVariantCode | null {
  if (points.length < 4) return null;

  const span = strokeWallSpan(points);
  const endo = strokeTouchesEndometrium(points);
  const serosa = strokeTouchesSerosa(points);

  if (!endo || !serosa || span < MIN_TRANSVERSE_SPAN) return null;

  const cavityPts = points.filter(([nx, ny]) => ny >= ENDO_MIN && ny <= 0.52 && nx > 0.12 && nx < 0.78).length;
  const serosaPts = points.filter(([nx, ny]) => nx > 0.1 && nx < 0.82 && (ny <= SEROSA_OUTER || ny >= SEROSA_INNER)).length;
  const cavityDominant = cavityPts >= Math.max(3, Math.ceil(points.length * 0.42));
  const serosaDominant = serosaPts >= Math.max(3, Math.ceil(points.length * 0.42));

  const submucosal = strokeHasSubmucosalDominance(points) || primaryFigo <= 2;
  if (submucosal) {
    const cavitySide = primaryFigo === 1 || (primaryFigo !== 2 && cavityDominant) ? "1" : "2";
    const serosaSide = primaryFigo === 6 || (serosaDominant && serosaPts >= cavityPts + 2) ? "6" : "5";
    return `${cavitySide}-${serosaSide}` as FigoVariantCode;
  }

  if (primaryFigo >= 3 && primaryFigo <= 5) return "3-5";
  if (primaryFigo === 4 || primaryFigo === 3 || primaryFigo === 5) return "3-5";

  return "3-5";
}

export function resolveFigoDisplayCode(
  primaryFigo: number,
  variant: FigoVariantCode | null | undefined,
): string {
  if (variant) return variant;
  return String(Math.max(0, Math.min(8, Math.round(primaryFigo))));
}
