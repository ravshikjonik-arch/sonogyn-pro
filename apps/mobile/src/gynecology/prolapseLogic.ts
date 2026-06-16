/** POP-Q staging — shared with web via @repo/medical-calculations/popq */

import {
  buildProtocolLine,
  compartmentLabel,
  computePopQStage,
  leadingCompartment,
  parsePopQField,
  type PopQInput,
  type PopQPointKey,
  type PopQStageKey,
} from "@repo/medical-calculations/popq";

export type POPQPointKey = PopQPointKey;
export type POPQStageKey = PopQStageKey;
export type POPQInput = PopQInput;

export {
  buildProtocolLine,
  compartmentLabel,
  computePopQStage as computePOPQStage,
  leadingCompartment,
  parsePopQField,
};

export function parsePOPQFields(raw: Record<POPQPointKey, string>): POPQInput {
  const out: POPQInput = {};
  (Object.keys(raw) as POPQPointKey[]).forEach((k) => {
    const n = parsePopQField(raw[k] ?? "");
    if (n !== undefined) out[k] = n;
  });
  return out;
}

export function computeFunctionalProlapsePercent(vRest: number, vValsalva: number): number | null {
  if (!Number.isFinite(vRest) || !Number.isFinite(vValsalva) || vRest <= 0) return null;
  return ((vValsalva - vRest) / vRest) * 100;
}

export type QuickStage = 1 | 2 | 3 | 4;

export function buildPopqProtocolLine(input: POPQInput, uterusPresent = true): string {
  const stage = computePopQStage(input);
  const leading = leadingCompartment(input, uterusPresent);
  return buildProtocolLine({ stageKey: stage.stageKey, leading, tvl: input.TVL });
}
