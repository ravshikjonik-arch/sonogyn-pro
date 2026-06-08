/** POP-Q staging helper (simplified clinical calculator; not a substitute for full examination). */

export type POPQPointKey = "Aa" | "Ba" | "Ap" | "Bp" | "C" | "D" | "GH" | "PB" | "TVL";

export type POPQStageKey = "0" | "1" | "2" | "3" | "4" | "na";

export type POPQInput = Partial<Record<POPQPointKey, number>>;

function parseCm(v: string): number | undefined {
  const t = v.trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function parsePOPQFields(raw: Record<POPQPointKey, string>): POPQInput {
  const out: POPQInput = {};
  (Object.keys(raw) as POPQPointKey[]).forEach((k) => {
    const n = parseCm(raw[k] ?? "");
    if (n !== undefined) out[k] = n;
  });
  return out;
}

/** Stage per simplified ladder on max(Aa,Ba,Ap,Bp,C,D) and TVL (cm). */
export function computePOPQStage(input: POPQInput): {
  maxPoint: number | null;
  stageKey: POPQStageKey;
} {
  const keys: Array<"Aa" | "Ba" | "Ap" | "Bp" | "C" | "D"> = ["Aa", "Ba", "Ap", "Bp", "C", "D"];
  const vals = keys.map((k) => input[k]).filter((v): v is number => typeof v === "number");
  if (vals.length === 0) {
    return { maxPoint: null, stageKey: "na" };
  }
  const maxPoint = Math.max(...vals);
  const tvl = typeof input.TVL === "number" && Number.isFinite(input.TVL) ? input.TVL : 6;

  const allBelowMinus1 = keys.every((k) => {
    const v = input[k];
    return typeof v === "number" && v < -1;
  });
  const allKeysPresent = keys.every((k) => typeof input[k] === "number");

  if (allKeysPresent && allBelowMinus1) {
    return { maxPoint, stageKey: "0" };
  }
  if (maxPoint < -1) {
    return { maxPoint, stageKey: "1" };
  }
  if (maxPoint >= -1 && maxPoint <= 1) {
    return { maxPoint, stageKey: "2" };
  }
  const threshold = tvl - 2;
  if (threshold <= 1) {
    return { maxPoint, stageKey: "4" };
  }
  if (maxPoint > 1 && maxPoint < threshold) {
    return { maxPoint, stageKey: "3" };
  }
  if (maxPoint >= threshold) {
    return { maxPoint, stageKey: "4" };
  }
  return { maxPoint, stageKey: "2" };
}

export function computeFunctionalProlapsePercent(vRest: number, vValsalva: number): number | null {
  if (!Number.isFinite(vRest) || !Number.isFinite(vValsalva) || vRest <= 0) return null;
  return ((vValsalva - vRest) / vRest) * 100;
}

export type QuickStage = 1 | 2 | 3 | 4;
