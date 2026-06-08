import type { BreastInput, CervixInput, MyometriumInput, OvaryInput } from "../types";
import { assertInRange, HARD_LIMITS } from "../utils/validators";

export function validateCervixInput(input: CervixInput): void {
  assertInRange(input.internalOsStiffness, HARD_LIMITS.stiffnessIndex, "internalOsStiffness");
  assertInRange(input.externalOsStiffness, HARD_LIMITS.stiffnessIndex, "externalOsStiffness");
  if (input.gestationalWeeks !== undefined) {
    assertInRange(input.gestationalWeeks, HARD_LIMITS.gestationalWeeks, "gestationalWeeks");
  }
}

export function validateMyometriumInput(input: MyometriumInput): void {
  assertInRange(input.lesionYoungModulusKpa, HARD_LIMITS.kPa, "lesionYoungModulusKpa");
  assertInRange(input.referenceMyometriumKpa, HARD_LIMITS.kPa, "referenceMyometriumKpa");
  const sweRatio = input.lesionYoungModulusKpa / input.referenceMyometriumKpa;
  assertInRange(sweRatio, HARD_LIMITS.sweRatio, "SWE Ratio (расчётный)");
}

export function validateOvaryInput(input: OvaryInput): void {
  if (input.strainRatio !== undefined) {
    assertInRange(input.strainRatio, HARD_LIMITS.strainRatio, "strainRatio");
  }
  if (input.youngModulusKpa !== undefined) {
    assertInRange(input.youngModulusKpa, HARD_LIMITS.kPa, "youngModulusKpa");
  }
}

export function validateBreastInput(input: BreastInput): void {
  if (input.tsukubaScore !== undefined) {
    assertInRange(input.tsukubaScore, HARD_LIMITS.tsukubaScore, "tsukubaScore");
  }
  if (input.strainRatio !== undefined) {
    assertInRange(input.strainRatio, HARD_LIMITS.strainRatio, "strainRatio");
  }
  if (input.emaxKpa !== undefined) {
    assertInRange(input.emaxKpa, HARD_LIMITS.kPa, "emaxKpa");
  }
  if (input.lesionSizeMm !== undefined) {
    assertInRange(input.lesionSizeMm, HARD_LIMITS.lesionSizeMm, "lesionSizeMm");
  }
  if (input.lesionDepthMm !== undefined) {
    assertInRange(input.lesionDepthMm, HARD_LIMITS.lesionDepthMm, "lesionDepthMm");
  }
}

export function validateElastographyInput(input: {
  organ: "cervix";
  data: CervixInput;
}): void;
export function validateElastographyInput(input: {
  organ: "myometrium";
  data: MyometriumInput;
}): void;
export function validateElastographyInput(input: { organ: "ovary"; data: OvaryInput }): void;
export function validateElastographyInput(input: { organ: "breast"; data: BreastInput }): void;
export function validateElastographyInput(input: {
  organ: string;
  data: CervixInput | MyometriumInput | OvaryInput | BreastInput;
}): void {
  switch (input.organ) {
    case "cervix":
      validateCervixInput(input.data as CervixInput);
      break;
    case "myometrium":
      validateMyometriumInput(input.data as MyometriumInput);
      break;
    case "ovary":
      validateOvaryInput(input.data as OvaryInput);
      break;
    case "breast":
      validateBreastInput(input.data as BreastInput);
      break;
  }
}
