import sources from "../data/sources.json";

import type { SimpleRulesInput, SimpleRulesResult, SimpleRulesVerdict } from "./types";
import { validateSimpleRulesInput } from "./validation";

export function evaluateSimpleRules(
  raw: Partial<SimpleRulesInput>,
): SimpleRulesResult | { ok: false; errors: import("./types").ValidationError[] } {
  const validated = validateSimpleRulesInput(raw);
  if (!validated.ok) return validated;
  const { benignFeatures, malignantFeatures } = validated.value;
  let verdict: SimpleRulesVerdict = "inconclusive";
  if (benignFeatures.length > 0 && malignantFeatures.length === 0) verdict = "benign";
  else if (malignantFeatures.length > 0 && benignFeatures.length === 0) verdict = "malignant";
  const meta = sources.simpleRules;
  return {
    modelId: meta.modelId,
    modelVersion: meta.modelVersion,
    publication: meta.publication,
    verdict,
    benignMatched: benignFeatures,
    malignantMatched: malignantFeatures,
  };
}
