import { ORGAN_FIELD_DEFINITIONS } from "../constants/ui";
import {
  assertInRange,
  calculateBreast,
  calculateCervix,
  calculateMyometrium,
  calculateOvary,
  ElastographyInputError,
  HARD_LIMITS,
} from "@repo/medical-calculations/elastography";

const FIELD_HARD_LIMIT_KEY: Record<string, keyof typeof HARD_LIMITS> = {
  internalOsStiffness: "stiffnessIndex",
  externalOsStiffness: "stiffnessIndex",
  gestationalWeeks: "gestationalWeeks",
  lesionYoungModulusKpa: "kPa",
  referenceMyometriumKpa: "kPa",
  youngModulusKpa: "kPa",
  emaxKpa: "kPa",
  strainRatio: "strainRatio",
  tsukubaScore: "tsukubaScore",
  lesionSizeMm: "lesionSizeMm",
  lesionDepthMm: "lesionDepthMm",
};

function expectThrows(name: string, fn: () => void, field?: string) {
  try {
    fn();
    throw new Error(`${name}: expected ElastographyInputError`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("expected ElastographyInputError")) throw e;
    if (!(e instanceof ElastographyInputError)) {
      throw new Error(`${name}: expected ElastographyInputError, got ${String(e)}`);
    }
    if (field && e.field !== field) {
      throw new Error(`${name}: expected field "${field}", got "${e.field}"`);
    }
  }
}

function expectOk(name: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    throw new Error(`${name}: unexpected throw: ${String(e)}`);
  }
}

function runAssertInRangeTests() {
  assertInRange(50, HARD_LIMITS.kPa, "kPa");
  assertInRange(HARD_LIMITS.kPa.min, HARD_LIMITS.kPa, "kPa_min");
  assertInRange(HARD_LIMITS.kPa.max, HARD_LIMITS.kPa, "kPa_max");

  expectThrows("kPa_too_high", () => assertInRange(999, HARD_LIMITS.kPa, "emaxKpa"), "emaxKpa");
  expectThrows("kPa_too_low", () => assertInRange(0.01, HARD_LIMITS.kPa, "emaxKpa"), "emaxKpa");
  expectThrows("nan", () => assertInRange(Number.NaN, HARD_LIMITS.kPa, "x"), "x");
  expectThrows("infinity", () => assertInRange(Number.POSITIVE_INFINITY, HARD_LIMITS.strainRatio, "sr"), "sr");
}

function runCalculatorHardLimitTests() {
  expectThrows(
    "cervix_stiffness_high",
    () =>
      calculateCervix({
        internalOsStiffness: 1.5,
        externalOsStiffness: 0.5,
      }),
    "internalOsStiffness",
  );

  expectThrows(
    "myometrium_kpa_absurd",
    () =>
      calculateMyometrium({
        lesionYoungModulusKpa: 999,
        referenceMyometriumKpa: 30,
        lesionType: "fibroid",
      }),
    "lesionYoungModulusKpa",
  );

  expectThrows(
    "ovary_strain_absurd",
    () =>
      calculateOvary({
        strainRatio: 99,
        iotaType: "cyst",
        method: "strain",
      }),
    "strainRatio",
  );

  expectThrows(
    "breast_emax_absurd",
    () =>
      calculateBreast({
        emaxKpa: 999,
        method: "shear_wave",
      }),
    "emaxKpa",
  );

  expectOk("cervix_valid", () =>
    calculateCervix({
      internalOsStiffness: 0.4,
      externalOsStiffness: 0.6,
      gestationalWeeks: 28,
    }),
  );

  expectOk("myometrium_valid", () =>
    calculateMyometrium({
      lesionYoungModulusKpa: 55,
      referenceMyometriumKpa: 25,
      lesionType: "fibroid",
    }),
  );

  expectOk("ovary_valid", () =>
    calculateOvary({
      strainRatio: 2.5,
      youngModulusKpa: 22,
      iotaType: "cyst",
      method: "both",
    }),
  );

  expectOk("breast_valid", () =>
    calculateBreast({
      tsukubaScore: 2,
      strainRatio: 1.8,
      emaxKpa: 45,
      method: "both",
    }),
  );
}

function runUiHardLimitSyncTests() {
  for (const [organ, methods] of Object.entries(ORGAN_FIELD_DEFINITIONS)) {
    for (const [method, fields] of Object.entries(methods)) {
      if (!fields) continue;
      for (const field of fields) {
        const limitKey = FIELD_HARD_LIMIT_KEY[field.key];
        if (!limitKey) {
          throw new Error(`UI field "${organ}/${method}/${field.key}" has no HARD_LIMITS mapping`);
        }
        const limit = HARD_LIMITS[limitKey];
        if (field.min !== limit.min || field.max !== limit.max) {
          throw new Error(
            `${organ}/${method}/${field.key}: UI [${field.min}, ${field.max}] != HARD_LIMITS [${limit.min}, ${limit.max}]`,
          );
        }
      }
    }
  }
}

function run() {
  runAssertInRangeTests();
  runCalculatorHardLimitTests();
  runUiHardLimitSyncTests();
}

run();
