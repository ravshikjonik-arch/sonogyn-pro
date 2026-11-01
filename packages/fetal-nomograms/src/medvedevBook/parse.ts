/** Parse "нед/дни" or "нед+дни" → total days from LMP-style GA. */
export function parseGaSlashToDays(raw: string): number | null {
  const s = raw.trim().replace("+", "/");
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (!m) return null;
  const w = Number(m[1]);
  const d = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(d) || d < 0 || d > 6) return null;
  return w * 7 + d;
}

export function parseGaSlashParts(raw: string): { weeks: number; days: number } | null {
  const total = parseGaSlashToDays(raw);
  if (total == null) return null;
  return { weeks: Math.floor(total / 7), days: total % 7 };
}

export function formatGaDays(totalDays: number): string {
  const w = Math.floor(totalDays / 7);
  const d = totalDays % 7;
  return `${w}+${d}`;
}

/** "45-50" → [45, 50]; "19-20" → [19, 20] */
export function parseInclusiveRange(raw: string): [number, number] | null {
  const m = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/.exec(raw.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return [a, b];
}

export function inRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

type BandLike = Record<string, unknown>;

export function extractNumericBand(
  obj: BandLike | null | undefined,
  percentiles: number[] | undefined,
): {
  pLow?: number;
  p50?: number;
  pHigh?: number;
  median?: number;
  mom1_5?: number;
  kind: "p5_p95" | "p2_5_p97_5" | "p50_p95" | "mom";
} | null {
  if (!obj || typeof obj !== "object") return null;

  if ("median" in obj || "mom1_5" in obj) {
    return {
      median: num(obj.median),
      mom1_5: num(obj.mom1_5),
      kind: "mom",
    };
  }

  const use25 = percentiles?.includes(2.5) || "p2_5" in obj || "p97_5" in obj;
  if (use25) {
    return {
      pLow: num(obj.p2_5),
      p50: num(obj.p50),
      pHigh: num(obj.p97_5),
      kind: "p2_5_p97_5",
    };
  }

  const p5 = num(obj.p5);
  const p50 = num(obj.p50);
  const p95 = num(obj.p95);
  if (p5 == null && p50 != null && p95 != null) {
    return { p50, pHigh: p95, kind: "p50_p95" };
  }
  if (p5 != null || p50 != null || p95 != null) {
    return { pLow: p5, p50, pHigh: p95, kind: "p5_p95" };
  }
  return null;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function nearestWeekKey(
  weeks: Record<string, unknown>,
  gaWeeks: number,
): string | null {
  const exact = String(gaWeeks);
  if (exact in weeks) return exact;

  let best: string | null = null;
  let bestDist = Infinity;
  for (const key of Object.keys(weeks)) {
    const range = parseInclusiveRange(key);
    if (range && inRange(gaWeeks, range)) return key;
    const n = Number(key);
    if (!Number.isFinite(n)) continue;
    const dist = Math.abs(n - gaWeeks);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}
