import coefficients from "../data/coefficients.json";
import sources from "../data/sources.json";

import { adnexProbabilities, log2, papillaryCoefficient } from "./math";
import type { AdnexInput, AdnexResult } from "./types";
import { validateAdnexInput } from "./validation";

type AdnexCoefBlock = {
  intercept: number;
  age: number;
  log2Ca125?: number;
  log2MaxDiameterMm: number;
  solidRatio: number;
  solidRatioSquared: number;
  moreThan10Locules: number;
  papillaryCount: number;
  acousticShadows: number;
  ascites: number;
  oncologyCenter: number;
};

function linearZ(block: AdnexCoefBlock, input: AdnexInput, withCa125: boolean): number {
  const ratio = input.maxDiameterMm > 0 ? input.maxSolidDiameterMm / input.maxDiameterMm : 0;
  const E = input.moreThan10Locules ? 1 : 0;
  const F = papillaryCoefficient(input.papillaryCount);
  const G = input.acousticShadows ? 1 : 0;
  const H = input.ascites ? 1 : 0;
  const I = input.oncologyCenter ? 1 : 0;
  let z = block.intercept + block.age * input.ageYears;
  if (withCa125 && block.log2Ca125 != null && input.ca125Uml != null) {
    z += block.log2Ca125 * log2(input.ca125Uml);
  }
  z += block.log2MaxDiameterMm * log2(input.maxDiameterMm);
  z += block.solidRatio * ratio + block.solidRatioSquared * ratio * ratio;
  z += block.moreThan10Locules * E;
  z += block.papillaryCount * F;
  z += block.acousticShadows * G;
  z += block.ascites * H;
  z += block.oncologyCenter * I;
  return z;
}

export function calculateAdnex(raw: Partial<AdnexInput>): AdnexResult | { ok: false; errors: import("./types").ValidationError[] } {
  const validated = validateAdnexInput(raw);
  if (!validated.ok) return validated;
  const input = validated.value;
  const usedCa125 = input.ca125Uml != null;
  const pack = usedCa125 ? coefficients.adnexWithCa125 : coefficients.adnexWithoutCa125;
  const z1 = linearZ(pack.z1_borderline as AdnexCoefBlock, input, usedCa125);
  const z2 = linearZ(pack.z2_stage1 as AdnexCoefBlock, input, usedCa125);
  const z3 = linearZ(pack.z3_stage2_4 as AdnexCoefBlock, input, usedCa125);
  const z4 = linearZ(pack.z4_metastatic as AdnexCoefBlock, input, usedCa125);
  const p = adnexProbabilities([z1, z2, z3, z4]);
  const malignancyRisk = p.borderline + p.stage1 + p.stage2_4 + p.metastatic;
  const meta = sources.adnex;
  return {
    modelId: meta.modelId,
    modelVersion: meta.modelVersion,
    publication: meta.publication,
    usedCa125,
    probabilities: p,
    malignancyRisk,
  };
}
