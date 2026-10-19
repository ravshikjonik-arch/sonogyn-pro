import coefficients from "../data/coefficients.json";
import sources from "../data/sources.json";

import { expLogistic } from "./math";
import type { Lr2Input, Lr2Result } from "./types";
import { validateLr2Input } from "./validation";

export function calculateLr2(raw: Partial<Lr2Input>): Lr2Result | { ok: false; errors: import("./types").ValidationError[] } {
  const validated = validateLr2Input(raw);
  if (!validated.ok) return validated;
  const input = validated.value;
  const c = coefficients.lr2;
  const solid = Math.min(input.maxSolidDiameterMm, c.maxSolidCapMm);
  let z = c.intercept;
  z += c.ageYears * input.ageYears;
  z += input.ascites ? c.ascites : 0;
  z += input.bloodFlowInSolidPapillary ? c.bloodFlowInSolidPapillary : 0;
  z += c.maxSolidDiameterMm * solid;
  z += input.irregularInternalWalls ? c.irregularInternalWalls : 0;
  z += input.acousticShadows ? c.acousticShadows : 0;
  const meta = sources.lr2;
  return {
    modelId: meta.modelId,
    modelVersion: meta.modelVersion,
    publication: meta.publication,
    malignancyRisk: expLogistic(z),
  };
}
