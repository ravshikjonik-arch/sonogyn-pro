import { analyzeSliceHit, sliceNormToModelPosition, type SliceNorm } from "./sliceAtlas";
import type { PathologyAnnotation, SizeMm } from "./pathologyTypes";

export type SliceDrawMode = "ellipse2" | "ellipse4";

export type SliceEllipse = {
  cx: number;
  cy: number;
  /** полуоси в нормализованных координатах среза */
  rx: number;
  ry: number;
  /** радианы */
  rotation: number;
};

export type SliceLesionShape = {
  mode: SliceDrawMode;
  points: SliceNorm[];
  ellipse: SliceEllipse;
};

/** ~длина тела матки на схеме (мм на единицу nx) */
export const SLICE_MM_PER_NORM_X = 108;
/** ~толщина стенки (мм на единицу ny) */
export const SLICE_MM_PER_NORM_Y = 72;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function dist(a: SliceNorm, b: SliceNorm): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy);
}

/** Две точки — противоположные концы главной оси овала */
export function ellipseFromTwoPoints(p1: SliceNorm, p2: SliceNorm): SliceEllipse {
  const cx = (p1[0] + p2[0]) / 2;
  const cy = (p1[1] + p2[1]) / 2;
  const rx = Math.max(0.012, dist(p1, p2) / 2);
  const ry = Math.max(0.01, rx * 0.62);
  const rotation = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  return { cx: clamp01(cx), cy: clamp01(cy), rx, ry, rotation };
}

/** Четыре точки — углы области; овал по охватывающему прямоугольнику */
export function ellipseFromFourPoints(points: SliceNorm[]): SliceEllipse {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max(0.012, (maxX - minX) / 2);
  const ry = Math.max(0.01, (maxY - minY) / 2);
  return { cx: clamp01(cx), cy: clamp01(cy), rx, ry, rotation: 0 };
}

export function buildLesionShape(mode: SliceDrawMode, points: SliceNorm[]): SliceLesionShape {
  const ellipse =
    mode === "ellipse2" && points.length >= 2
      ? ellipseFromTwoPoints(points[0], points[1])
      : ellipseFromFourPoints(points);
  return { mode, points: [...points], ellipse };
}

export function sampleEllipsePoints(e: SliceEllipse, n = 12): SliceNorm[] {
  const out: SliceNorm[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const lx = e.rx * Math.cos(t);
    const ly = e.ry * Math.sin(t);
    const nx = e.cx + lx * Math.cos(e.rotation) - ly * Math.sin(e.rotation);
    const ny = e.cy + lx * Math.sin(e.rotation) + ly * Math.cos(e.rotation);
    out.push([clamp01(nx), clamp01(ny)]);
  }
  return out;
}

export function sizeMmFromEllipse(e: SliceEllipse): SizeMm {
  const length = Math.max(6, Math.round(2 * e.rx * SLICE_MM_PER_NORM_X));
  const width = Math.max(5, Math.round(2 * e.ry * SLICE_MM_PER_NORM_Y));
  const depth = Math.max(4, Math.round(Math.min(length, width) * 0.72));
  return { length, width, depth };
}

/**
 * FIGO по форме узла на срезе: анализ центра и точек овала относительно полости / серозы.
 */
export function figoFromLesionEllipse(e: SliceEllipse, pedunculated: boolean): number {
  const samples = sampleEllipsePoints(e, 16);
  const center = analyzeSliceHit(e.cx, e.cy, pedunculated);
  let bestSubmucosal = 8;
  let bestSerosal = 8;

  for (const [nx, ny] of samples) {
    const hit = analyzeSliceHit(nx, ny, pedunculated);
    if (hit.figoType <= 2) bestSubmucosal = Math.min(bestSubmucosal, hit.figoType);
    if (hit.figoType >= 5 && hit.figoType <= 7) bestSerosal = Math.min(bestSerosal, hit.figoType);
  }

  const cavityTouch = samples.some(
    ([nx, ny]) => ny > 0.38 && ny < 0.56 && nx > 0.1 && nx < 0.8,
  );
  const serosaTouch = samples.some(([nx, ny]) => ny < 0.34 || ny > 0.64);

  if (cavityTouch && bestSubmucosal <= 2) return pedunculated && center.figoType === 0 ? 0 : bestSubmucosal;
  if (serosaTouch && bestSerosal <= 7) return pedunculated && bestSerosal === 6 ? 7 : bestSerosal;
  if (center.figoType === 3 || center.figoType === 5) return center.figoType;
  return center.figoType;
}

export function lesionShapeFromAnnotation(a: PathologyAnnotation): SliceLesionShape | null {
  if (a.sliceShape) return a.sliceShape;
  if (!a.sliceNorm) return null;
  const r = 0.028;
  return {
    mode: "ellipse2",
    points: [a.sliceNorm, [a.sliceNorm[0] + r, a.sliceNorm[1] + r * 0.6]],
    ellipse: { cx: a.sliceNorm[0], cy: a.sliceNorm[1], rx: r, ry: r * 0.62, rotation: 0 },
  };
}

export function annotationFromLesionShape(
  type: PathologyAnnotation["type"],
  shape: SliceLesionShape,
  patch?: Partial<PathologyAnnotation>,
): PathologyAnnotation {
  const { cx, cy } = shape.ellipse;
  const pos = sliceNormToModelPosition(cx, cy);
  const sizeMm = sizeMmFromEllipse(shape.ellipse);
  const ped = patch?.pedunculated ?? false;
  const figoType = type === "myoma" ? figoFromLesionEllipse(shape.ellipse, ped) : undefined;

  return {
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    position: pos,
    sliceNorm: [cx, cy],
    sliceShape: shape,
    sizeMm,
    pedunculated: ped,
    figoOverride: null,
    figoType,
    ...patch,
  };
}
