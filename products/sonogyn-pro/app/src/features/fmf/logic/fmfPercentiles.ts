type Metric = "ac" | "bpd" | "hc" | "fl" | "efw";
type Mode = "quick" | "strict";

type WeekRow = {
  week: number;
  acMedian: number;
  acSd: number;
  bpdMedian: number;
  bpdSd: number;
  hcMedian: number;
  hcSd: number;
  flMedian: number;
  flSd: number;
  efwMedian: number;
  efwSd: number;
};

// Internal reference table for strict mode interpolation.
const TABLE: WeekRow[] = [
  { week: 20, acMedian: 150, acSd: 10, bpdMedian: 49, bpdSd: 3, hcMedian: 180, hcSd: 10, flMedian: 34, flSd: 2.5, efwMedian: 350, efwSd: 70 },
  { week: 22, acMedian: 170, acSd: 11, bpdMedian: 54, bpdSd: 3, hcMedian: 200, hcSd: 11, flMedian: 38, flSd: 3, efwMedian: 500, efwSd: 85 },
  { week: 24, acMedian: 190, acSd: 12, bpdMedian: 59, bpdSd: 3, hcMedian: 220, hcSd: 12, flMedian: 43, flSd: 3, efwMedian: 700, efwSd: 110 },
  { week: 26, acMedian: 215, acSd: 13, bpdMedian: 64, bpdSd: 3.5, hcMedian: 240, hcSd: 12, flMedian: 48, flSd: 3.2, efwMedian: 950, efwSd: 140 },
  { week: 28, acMedian: 240, acSd: 14, bpdMedian: 71, bpdSd: 3.5, hcMedian: 260, hcSd: 13, flMedian: 53, flSd: 3.4, efwMedian: 1250, efwSd: 175 },
  { week: 30, acMedian: 265, acSd: 15, bpdMedian: 76, bpdSd: 3.8, hcMedian: 280, hcSd: 14, flMedian: 58, flSd: 3.6, efwMedian: 1600, efwSd: 210 },
  { week: 32, acMedian: 285, acSd: 16, bpdMedian: 81, bpdSd: 4, hcMedian: 295, hcSd: 15, flMedian: 62, flSd: 3.8, efwMedian: 1950, efwSd: 245 },
  { week: 34, acMedian: 305, acSd: 17, bpdMedian: 85, bpdSd: 4, hcMedian: 310, hcSd: 16, flMedian: 66, flSd: 4, efwMedian: 2300, efwSd: 280 },
  { week: 36, acMedian: 325, acSd: 18, bpdMedian: 88, bpdSd: 4.2, hcMedian: 322, hcSd: 17, flMedian: 69, flSd: 4.2, efwMedian: 2700, efwSd: 320 },
  { week: 38, acMedian: 340, acSd: 19, bpdMedian: 91, bpdSd: 4.2, hcMedian: 332, hcSd: 18, flMedian: 72, flSd: 4.4, efwMedian: 3100, efwSd: 360 },
  { week: 40, acMedian: 350, acSd: 20, bpdMedian: 93, bpdSd: 4.4, hcMedian: 340, hcSd: 18, flMedian: 74, flSd: 4.5, efwMedian: 3450, efwSd: 390 },
];

function interpolate(weeks: number): WeekRow {
  if (weeks <= TABLE[0].week) return TABLE[0];
  if (weeks >= TABLE[TABLE.length - 1].week) return TABLE[TABLE.length - 1];
  for (let i = 0; i < TABLE.length - 1; i += 1) {
    const a = TABLE[i];
    const b = TABLE[i + 1];
    if (weeks >= a.week && weeks <= b.week) {
      const t = (weeks - a.week) / (b.week - a.week);
      const lerp = (x: number, y: number) => x + (y - x) * t;
      return {
        week: weeks,
        acMedian: lerp(a.acMedian, b.acMedian),
        acSd: lerp(a.acSd, b.acSd),
        bpdMedian: lerp(a.bpdMedian, b.bpdMedian),
        bpdSd: lerp(a.bpdSd, b.bpdSd),
        hcMedian: lerp(a.hcMedian, b.hcMedian),
        hcSd: lerp(a.hcSd, b.hcSd),
        flMedian: lerp(a.flMedian, b.flMedian),
        flSd: lerp(a.flSd, b.flSd),
        efwMedian: lerp(a.efwMedian, b.efwMedian),
        efwSd: lerp(a.efwSd, b.efwSd),
      };
    }
  }
  return TABLE[TABLE.length - 1];
}

function erfApprox(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax);
  return sign * y;
}

function percentileFromZ(z: number): number {
  const cdf = 0.5 * (1 + erfApprox(z / Math.SQRT2));
  return Math.max(1, Math.min(99, Math.round(cdf * 100)));
}

function strictPercentile(metric: Metric, value: number, gaWeeks: number): number {
  const row = interpolate(gaWeeks);
  const pair =
    metric === "ac"
      ? { median: row.acMedian, sd: row.acSd }
      : metric === "bpd"
        ? { median: row.bpdMedian, sd: row.bpdSd }
        : metric === "hc"
          ? { median: row.hcMedian, sd: row.hcSd }
          : metric === "fl"
            ? { median: row.flMedian, sd: row.flSd }
            : { median: row.efwMedian, sd: row.efwSd };
  const z = (value - pair.median) / pair.sd;
  return percentileFromZ(z);
}

function quickPercentile(metric: Metric, value: number, gaWeeks: number): number {
  const expected =
    metric === "ac"
      ? 12 * gaWeeks - 90
      : metric === "bpd"
        ? 2.2 * gaWeeks + 10
        : metric === "hc"
          ? 8.2 * gaWeeks + 20
          : metric === "fl"
            ? 2.1 * gaWeeks - 8
            : 130 * gaWeeks - 2200;
  if (expected <= 0) return 50;
  const ratio = value / expected;
  if (ratio < 0.85) return 5;
  if (ratio < 0.95) return 15;
  if (ratio > 1.2) return 95;
  if (ratio > 1.1) return 85;
  return 50;
}

export function calcPercentile(metric: Metric, value: number | undefined, gaWeeks: number | undefined, mode: Mode): number | null {
  if (!value || !gaWeeks) return null;
  return mode === "strict" ? strictPercentile(metric, value, gaWeeks) : quickPercentile(metric, value, gaWeeks);
}

