import coefficients from "../data/coefficients.json";
import sources from "../data/sources.json";

import { expLogistic } from "./math";
import type { SimpleRulesFeature, SimpleRulesRiskInput, SimpleRulesRiskResult } from "./types";
import { validateSimpleRulesRiskInput } from "./validation";

const FEATURE_KEYS: SimpleRulesFeature[] = ["B1", "B2", "B3", "B4", "B5", "M1", "M2", "M3", "M4", "M5"];

export function calculateSimpleRulesRisk(
  raw: Partial<SimpleRulesRiskInput>,
): SimpleRulesRiskResult | { ok: false; errors: import("./types").ValidationError[] } {
  const validated = validateSimpleRulesRiskInput(raw);
  if (!validated.ok) return validated;
  const input = validated.value;
  const c = coefficients.simpleRulesRisk;
  let rs = c.intercept;
  if (input.oncologyCenter) rs += c.oncologyCenter;
  for (const key of FEATURE_KEYS) {
    const inBenign = input.benignFeatures.includes(key);
    const inMalignant = input.malignantFeatures.includes(key);
    if (inBenign) rs += c[key as keyof typeof c] as number;
    if (inMalignant) rs += c[key as keyof typeof c] as number;
  }
  const meta = sources.simpleRulesRisk;
  return {
    modelId: meta.modelId,
    modelVersion: meta.modelVersion,
    publication: meta.publication,
    regressionScore: rs,
    malignancyRisk: expLogistic(rs),
  };
}
