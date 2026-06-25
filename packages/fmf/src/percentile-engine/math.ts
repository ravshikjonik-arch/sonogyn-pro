/** Normal CDF approximation (Abramowitz & Stegun) */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z >= 0 ? 1 - p : p;
}

export function percentileFromZ(z: number): number {
  const p = normalCdf(z) * 100;
  return Math.max(0.1, Math.min(99.9, Math.round(p * 10) / 10));
}

export function zScoreFromValue(value: number, mean: number, sd: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(mean) || !Number.isFinite(sd) || sd <= 0) {
    return NaN;
  }
  return (value - mean) / sd;
}

export function calculateMoM(value: number, expected: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(expected) || expected <= 0) return NaN;
  return Math.round((value / expected) * 1000) / 1000;
}

export function valueAtPercentileZ(mean: number, sd: number, z: number): number {
  return mean + z * sd;
}

const Z_MAP: Record<number, number> = {
  3: -1.88,
  5: -1.645,
  10: -1.28,
  50: 0,
  90: 1.28,
  95: 1.645,
  97: 1.88,
};

export function buildPercentileBand(mean: number, sd: number): {
  p3: number;
  p5: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  p97: number;
} {
  return {
    p3: round(valueAtPercentileZ(mean, sd, Z_MAP[3]!)),
    p5: round(valueAtPercentileZ(mean, sd, Z_MAP[5]!)),
    p10: round(valueAtPercentileZ(mean, sd, Z_MAP[10]!)),
    p50: round(mean),
    p90: round(valueAtPercentileZ(mean, sd, Z_MAP[90]!)),
    p95: round(valueAtPercentileZ(mean, sd, Z_MAP[95]!)),
    p97: round(valueAtPercentileZ(mean, sd, Z_MAP[97]!)),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateMap(sbp: number, dbp: number): number {
  return Math.round((dbp + (sbp - dbp) / 3) * 10) / 10;
}

export function calculateGrowthVelocity(
  valueNow: number,
  valuePrior: number,
  gaDaysNow: number,
  gaDaysPrior: number,
): number | undefined {
  const deltaDays = gaDaysNow - gaDaysPrior;
  if (deltaDays <= 0) return undefined;
  return Math.round(((valueNow - valuePrior) / deltaDays) * 100) / 100;
}

/** Robinson-Fleming GA from CRL (mm) */
export function gaDaysFromCrlMm(crlMm: number): number | null {
  if (!Number.isFinite(crlMm) || crlMm < 2 || crlMm > 84) return null;
  return Math.round(8.052 * Math.sqrt(crlMm) + 23.73);
}
