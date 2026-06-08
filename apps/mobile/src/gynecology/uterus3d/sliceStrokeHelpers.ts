export type SliceNorm = [number, number];
export type SliceEditorTool = "navigate" | "draw";
export type SliceStroke = { points: SliceNorm[] };

const MM_X = 108;
const MM_Y = 72;
const MIN_POINTS = 6;
const MIN_PATH_LEN = 0.018;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function pathLength(pts: SliceNorm[]) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

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
  if (Math.hypot(tail[0] - end[0], tail[1] - end[1]) > minDist / 2) out.push(tail);
  return out;
}

export function boundsFromStroke(points: SliceNorm[]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export function sizeMmFromStroke(points: SliceNorm[]) {
  const b = boundsFromStroke(points);
  const length = Math.max(6, Math.round((b.maxX - b.minX) * MM_X));
  const width = Math.max(5, Math.round((b.maxY - b.minY) * MM_Y));
  return { length, width, depth: Math.max(4, Math.round(Math.min(length, width) * 0.72)) };
}

function depth01(_nx: number, ny: number) {
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

export function figoFromStroke(points: SliceNorm[], ped: boolean): number {
  const b = boundsFromStroke(points);
  let best = figoAt(b.cx, b.cy, ped);
  for (const [nx, ny] of points) {
    best = Math.min(best, figoAt(nx, ny, ped));
  }
  return best;
}

export function isValidStroke(points: SliceNorm[]): boolean {
  const s = simplifyStroke(points);
  return s.length >= MIN_POINTS && pathLength(s) >= MIN_PATH_LEN;
}

export function strokeToSvgPath(points: SliceNorm[], w: number, h: number, closed = true): string {
  if (!points.length) return "";
  const head = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0] * w} ${p[1] * h}`).join(" ");
  return closed && points.length > 2 ? `${head} Z` : head;
}

export function localizationRu(nx: number, ny: number): string {
  if (nx > 0.84) return "шейка матки";
  if (nx < 0.14) return "дно матки";
  if (ny < 0.36) return "передняя/верхняя стенка";
  if (ny > 0.62) return "задняя стенка";
  return "тело матки";
}
