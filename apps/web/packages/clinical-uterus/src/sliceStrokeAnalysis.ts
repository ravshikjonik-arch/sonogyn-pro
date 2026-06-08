import { analyzeSliceHit, sliceNormToModelPosition, type SliceNorm } from "./sliceAtlas";
import { figoFromLesionEllipse, sizeMmFromEllipse, type SliceEllipse } from "./sliceLesionShape";
import type { PathologyAnnotation, SizeMm } from "./pathologyTypes";

export type SliceEditorTool = "navigate" | "draw";

/** Контур, нарисованный врачом (координаты 0–1 на срезе) */
export type SliceStroke = {
  points: SliceNorm[];
};

const MIN_POINTS = 6;
const MIN_PATH_LEN = 0.018;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function pathLength(pts: SliceNorm[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

/** Упростить контур (Douglas-Peucker lite — прореживание) */
export function simplifyStroke(points: SliceNorm[], minDist = 0.004): SliceNorm[] {
  if (points.length <= 2) return points;
  const out: SliceNorm[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = out[out.length - 1];
    if (Math.hypot(points[i][0] - last[0], points[i][1] - last[1]) >= minDist) {
      out.push(points[i]);
    }
  }
  const tail = points[points.length - 1];
  const end = out[out.length - 1];
  if (Math.hypot(tail[0] - end[0], tail[1] - end[1]) > minDist / 2) {
    out.push(tail);
  }
  return out;
}

export function boundsFromStroke(points: SliceNorm[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cx: number;
  cy: number;
} {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function ellipseFromStroke(points: SliceNorm[]): SliceEllipse {
  const b = boundsFromStroke(points);
  return {
    cx: clamp01(b.cx),
    cy: clamp01(b.cy),
    rx: Math.max(0.008, (b.maxX - b.minX) / 2),
    ry: Math.max(0.008, (b.maxY - b.minY) / 2),
    rotation: 0,
  };
}

export function sizeMmFromStroke(points: SliceNorm[]): SizeMm {
  return sizeMmFromEllipse(ellipseFromStroke(points));
}

export function figoFromStroke(points: SliceNorm[], pedunculated: boolean): number {
  const e = ellipseFromStroke(points);
  const fromEllipse = figoFromLesionEllipse(e, pedunculated);
  let best = fromEllipse;
  for (const [nx, ny] of points) {
    const hit = analyzeSliceHit(nx, ny, pedunculated);
    if (hit.figoType < best || (hit.figoType <= 2 && best > 2)) {
      best = hit.figoType;
    }
  }
  return best;
}

export function strokeToSvgPath(points: SliceNorm[], w: number, h: number, closed = true): string {
  if (points.length === 0) return "";
  const head = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0] * w} ${p[1] * h}`)
    .join(" ");
  return closed && points.length > 2 ? `${head} Z` : head;
}

export function isValidStroke(points: SliceNorm[]): boolean {
  const simplified = simplifyStroke(points);
  return simplified.length >= MIN_POINTS && pathLength(simplified) >= MIN_PATH_LEN;
}

export function annotationFromStroke(
  type: PathologyAnnotation["type"],
  rawPoints: SliceNorm[],
  patch?: Partial<PathologyAnnotation>,
): PathologyAnnotation | null {
  const points = simplifyStroke(rawPoints);
  if (!isValidStroke(points)) return null;

  const b = boundsFromStroke(points);
  const pos = sliceNormToModelPosition(b.cx, b.cy);
  const sizeMm = sizeMmFromStroke(points);
  const ped = patch?.pedunculated ?? false;
  const stroke: SliceStroke = { points };
  const figoType = type === "myoma" ? figoFromStroke(points, ped) : undefined;

  return {
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    position: pos,
    sliceNorm: [b.cx, b.cy],
    sliceStroke: stroke,
    sizeMm,
    pedunculated: ped,
    figoOverride: null,
    figoType,
    ...patch,
  };
}

export function strokeFromAnnotation(a: PathologyAnnotation): SliceStroke | null {
  if (a.sliceStroke?.points.length) return a.sliceStroke;
  if (a.sliceShape?.points.length) {
    return { points: a.sliceShape.points };
  }
  if (a.sliceNorm) {
    const [cx, cy] = a.sliceNorm;
    const r = 0.025;
    return {
      points: [
        [cx - r, cy],
        [cx, cy - r * 0.6],
        [cx + r, cy],
        [cx, cy + r * 0.6],
        [cx - r, cy],
      ],
    };
  }
  return null;
}
