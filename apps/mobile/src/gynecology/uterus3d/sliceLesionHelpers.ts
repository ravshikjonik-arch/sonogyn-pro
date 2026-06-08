export type SliceNorm = [number, number];
export type SliceDrawMode = "ellipse2" | "ellipse4";

export type SliceEllipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
};

export type SliceLesionShape = {
  mode: SliceDrawMode;
  points: SliceNorm[];
  ellipse: SliceEllipse;
};

const MM_X = 108;
const MM_Y = 72;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function dist(a: SliceNorm, b: SliceNorm) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function ellipseFromTwoPoints(p1: SliceNorm, p2: SliceNorm): SliceEllipse {
  const cx = (p1[0] + p2[0]) / 2;
  const cy = (p1[1] + p2[1]) / 2;
  const rx = Math.max(0.012, dist(p1, p2) / 2);
  const ry = Math.max(0.01, rx * 0.62);
  return { cx: clamp01(cx), cy: clamp01(cy), rx, ry, rotation: Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) };
}

export function ellipseFromFourPoints(points: SliceNorm[]): SliceEllipse {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    cx: clamp01((minX + maxX) / 2),
    cy: clamp01((minY + maxY) / 2),
    rx: Math.max(0.012, (maxX - minX) / 2),
    ry: Math.max(0.01, (maxY - minY) / 2),
    rotation: 0,
  };
}

export function buildLesionShape(mode: SliceDrawMode, points: SliceNorm[]): SliceLesionShape {
  const ellipse =
    mode === "ellipse2" && points.length >= 2
      ? ellipseFromTwoPoints(points[0], points[1])
      : ellipseFromFourPoints(points);
  return { mode, points: [...points], ellipse };
}

export function sizeMmFromEllipse(e: SliceEllipse) {
  return {
    length: Math.max(6, Math.round(2 * e.rx * MM_X)),
    width: Math.max(5, Math.round(2 * e.ry * MM_Y)),
    depth: Math.max(4, Math.round(Math.min(2 * e.rx * MM_X, 2 * e.ry * MM_Y) * 0.72)),
  };
}

function depth01(nx: number, ny: number) {
  return clamp01(Math.abs(ny - 0.47) * 1.35);
}

function figoAt(nx: number, ny: number, ped: boolean): number {
  if (nx > 0.86) return 8;
  const d = depth01(nx, ny);
  if (d < 0.12) return ped ? 0 : d < 0.055 ? 1 : 2;
  if (d < 0.28) return 3;
  if (d < 0.58) return 4;
  if (d < 0.82) return 5;
  return ped && d > 0.88 ? 7 : 6;
}

function sampleEllipse(e: SliceEllipse, n = 12): SliceNorm[] {
  const out: SliceNorm[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const lx = e.rx * Math.cos(t);
    const ly = e.ry * Math.sin(t);
    out.push([
      clamp01(e.cx + lx * Math.cos(e.rotation) - ly * Math.sin(e.rotation)),
      clamp01(e.cy + lx * Math.sin(e.rotation) + ly * Math.cos(e.rotation)),
    ]);
  }
  return out;
}

export function figoFromEllipse(e: SliceEllipse, ped: boolean): number {
  const samples = sampleEllipse(e, 14);
  let bestSub = 8;
  let bestSer = 8;
  for (const [nx, ny] of samples) {
    const f = figoAt(nx, ny, ped);
    if (f <= 2) bestSub = Math.min(bestSub, f);
    if (f >= 5 && f <= 7) bestSer = Math.min(bestSer, f);
  }
  const cavity = samples.some(([nx, ny]) => ny > 0.38 && ny < 0.56 && nx > 0.1 && nx < 0.8);
  const serosa = samples.some(([nx, ny]) => ny < 0.34 || ny > 0.64);
  if (cavity && bestSub <= 2) return bestSub;
  if (serosa && bestSer <= 7) return ped && bestSer === 6 ? 7 : bestSer;
  return figoAt(e.cx, e.cy, ped);
}

export function localizationRu(nx: number, ny: number): string {
  if (nx > 0.84) return "шейка матки";
  if (nx < 0.14) return "дно матки";
  if (ny < 0.36) return "передняя/верхняя стенка";
  if (ny > 0.62) return "задняя стенка";
  return "тело матки";
}
