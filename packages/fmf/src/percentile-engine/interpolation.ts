import type { MeanSdAnchor } from "./types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function anchorX(anchor: MeanSdAnchor): number {
  if (anchor.gaDays != null) return anchor.gaDays;
  if (anchor.gaWeeks != null) return anchor.gaWeeks;
  return NaN;
}

export function interpolateMeanSd(
  anchors: MeanSdAnchor[],
  x: number,
): { mean: number; sd: number } | null {
  if (!anchors.length || !Number.isFinite(x)) return null;
  const sorted = [...anchors].sort((a, b) => anchorX(a) - anchorX(b));
  const minX = anchorX(sorted[0]!);
  const maxX = anchorX(sorted[sorted.length - 1]!);
  if (x < minX || x > maxX) return null;

  for (const a of sorted) {
    if (anchorX(a) === x) return { mean: a.mean, sd: a.sd };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i]!;
    const right = sorted[i + 1]!;
    const x0 = anchorX(left);
    const x1 = anchorX(right);
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return {
        mean: lerp(left.mean, right.mean, t),
        sd: lerp(left.sd, right.sd, t),
      };
    }
  }
  return null;
}

export function calculateExpectedValue(
  anchors: MeanSdAnchor[],
  x: number,
): { expected: number; sd: number } | null {
  const row = interpolateMeanSd(anchors, x);
  if (!row) return null;
  return { expected: row.mean, sd: row.sd };
}

export function calculateLogLinearExpected(
  crlMm: number,
  intercept: number,
  slope: number,
  xScale = 1,
  yTransform: "exp" | "none" = "exp",
  sdLog = 0.28,
): { expected: number; sd: number } | null {
  if (!Number.isFinite(crlMm)) return null;
  const x = crlMm * xScale;
  const linear = intercept + slope * x;
  const expected = yTransform === "exp" ? Math.exp(linear) : linear;
  const sd = yTransform === "exp" ? expected * sdLog : sdLog;
  return { expected, sd };
}
