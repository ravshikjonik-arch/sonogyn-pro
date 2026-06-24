import type { PriorBiopsyResult } from "@repo/ifcpc-expert";

import type { Histology } from "../domain/schemas";

export type HistologyProgression = {
  stage: string;
  progressionRisk: number;
  nextLikely: string[];
  evidence: string[];
};

const ORDER = ["negative", "cin1", "cin2", "cin3", "ais", "microinvasive", "invasive"] as const;

/** Part 4 — histology progression model. */
export function evaluateHistologyProgression(histology: Histology): HistologyProgression {
  const evidence: string[] = [];
  const r = histology.result;

  if (r === "none" || r === "pending") {
    return {
      stage: "unknown",
      progressionRisk: 0.1,
      nextLikely: ["cin1", "cin2"],
      evidence: ["Awaiting histology."],
    };
  }

  const idx = ORDER.indexOf(r as (typeof ORDER)[number]);
  const nextLikely = idx >= 0 && idx < ORDER.length - 1 ? [ORDER[idx + 1]] : [];

  const progressionMap: Record<string, { risk: number; stage: string; note: string }> = {
    negative: { risk: 0.05, stage: "normal", note: "Negative biopsy — surveillance per cytology." },
    cin1: { risk: 0.15, stage: "CIN1", note: "CIN1 — 13–17% regression, observation eligible." },
    cin2: { risk: 0.35, stage: "CIN2", note: "CIN2 — excision recommended (ASCCP)." },
    cin3: { risk: 0.55, stage: "CIN3", note: "CIN3 — excision mandatory." },
    ais: { risk: 0.45, stage: "AIS", note: "AIS — excision; margins critical." },
    microinvasive: { risk: 0.75, stage: "microinvasive", note: "Microinvasive — oncology staging." },
    invasive: { risk: 0.95, stage: "invasive", note: "Invasive cancer — oncology." },
  };

  const m = progressionMap[r] ?? progressionMap.negative;
  evidence.push(m.note);
  if (histology.marginsPositive) evidence.push("Positive margins — repeat excision.");

  return {
    stage: m.stage,
    progressionRisk: m.risk,
    nextLikely: [...nextLikely],
    evidence,
  };
}

export function histologyToPriorBiopsy(h: Histology): PriorBiopsyResult {
  const map: Record<Histology["result"], PriorBiopsyResult> = {
    none: "none",
    pending: "none",
    negative: "negative",
    cin1: "cin1",
    cin2: "cin2",
    cin3: "cin3",
    ais: "ais",
    microinvasive: "invasion",
    invasive: "invasion",
  } as const;
  return map[h.result];
}
