import type { HpvTest } from "../domain/schemas";

export type HpvRiskProfile = {
  band: "very_low" | "low" | "moderate" | "high" | "very_high";
  labelRu: string;
  cin2plusModifier: number;
  evidence: string[];
};

const GENOTYPE_LABELS: Record<string, string> = {
  hpv16: "HPV 16",
  hpv18: "HPV 18",
  hpv31: "HPV 31",
  hpv33: "HPV 33",
  hpv45: "HPV 45",
  hpv52: "HPV 52",
  hpv58: "HPV 58",
  other_hr: "Other HR-HPV",
};

/** Part 2 — HPV risk model with genotype persistence and viral load. */
export function evaluateHpvRisk(hpv: HpvTest): HpvRiskProfile {
  const evidence: string[] = [];
  const genotypes = hpv.genotypes.filter((g) => g !== "negative");

  if (hpv.status === "negative" || genotypes.length === 0) {
    return {
      band: "very_low",
      labelRu: "HPV отрицательный",
      cin2plusModifier: -0.15,
      evidence: ["WHO 2021: HPV− снижает вероятность CIN2+ при NILM/LSIL."],
    };
  }

  if (genotypes.includes("hpv16")) {
    evidence.push("ASCCP 2019: HPV16 — сильнейший предиктор CIN3+.");
    if (hpv.persistent) evidence.push("Persistent HPV16 — повышенный риск прогрессии.");
    return {
      band: hpv.persistent ? "very_high" : "high",
      labelRu: `HPV16${hpv.persistent ? " persistent" : ""}`,
      cin2plusModifier: hpv.persistent ? 0.35 : 0.25,
      evidence,
    };
  }

  if (genotypes.includes("hpv18")) {
    evidence.push("ASCCP 2019: HPV18 — AIS/адenocarcinoma pathway.");
    return {
      band: "high",
      labelRu: "HPV18+",
      cin2plusModifier: 0.2,
      evidence,
    };
  }

  const otherHr = genotypes.filter((g) =>
    ["hpv31", "hpv33", "hpv45", "hpv52", "hpv58", "other_hr"].includes(g),
  );
  if (otherHr.length > 0) {
    evidence.push(`Other HR genotypes: ${otherHr.map((g) => GENOTYPE_LABELS[g]).join(", ")}`);
    return {
      band: "moderate",
      labelRu: otherHr.map((g) => GENOTYPE_LABELS[g]).join(" + "),
      cin2plusModifier: 0.12 + otherHr.length * 0.03,
      evidence,
    };
  }

  if (hpv.viralLoad === "high") {
    evidence.push("High viral load — ассоциирован с персистенцией.");
  }

  return {
    band: "moderate",
    labelRu: "HPV положительный (unspecified)",
    cin2plusModifier: 0.1,
    evidence: ["HPV+ без 16/18 — moderate risk triage."],
  };
}

export function hpvToLegacyFlags(hpv: HpvTest) {
  const g = new Set(hpv.genotypes);
  return {
    hpvStatus: hpv.status,
    hpv16Positive: g.has("hpv16"),
    hpv18Positive: g.has("hpv18"),
    hpv3133455258Positive: ["hpv31", "hpv33", "hpv45", "hpv52", "hpv58"].some((x) => g.has(x as never)),
    otherHrHpvPositive: g.has("other_hr"),
  };
}
