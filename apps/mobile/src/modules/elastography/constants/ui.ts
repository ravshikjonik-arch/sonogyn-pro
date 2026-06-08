/**
 * UI-конфигурация полей ввода для каждого органа/метода.
 * min/max синхронизированы с HARD_LIMITS — без зависимостей от Expo/RN (для unit-тестов).
 */

import { HARD_LIMITS } from "@repo/medical-calculations/elastography";
import type { ElastographyMethod, ElastographyOrgan, FieldDefinition } from "../types";

function hardRange(limit: keyof typeof HARD_LIMITS): { min: number; max: number } {
  return { min: HARD_LIMITS[limit].min, max: HARD_LIMITS[limit].max };
}

const L = {
  kPa: hardRange("kPa"),
  stiffness: hardRange("stiffnessIndex"),
  strain: hardRange("strainRatio"),
  tsukuba: hardRange("tsukubaScore"),
  sizeMm: hardRange("lesionSizeMm"),
  depthMm: hardRange("lesionDepthMm"),
  weeks: hardRange("gestationalWeeks"),
} as const;

/** Какие методы эластографии доступны для каждого органа. */
export const ORGAN_METHODS: Record<
  Exclude<ElastographyOrgan, "abdomen_liver">,
  ElastographyMethod[]
> = {
  cervix: ["strain"],
  myometrium: ["shear_wave"],
  ovary: ["strain", "shear_wave", "both"],
  breast: ["strain", "shear_wave", "both"],
};

/** Определения полей динамической формы ввода по органу и методу. */
export const ORGAN_FIELD_DEFINITIONS: Record<
  Exclude<ElastographyOrgan, "abdomen_liver">,
  Partial<Record<ElastographyMethod, FieldDefinition[]>>
> = {
  cervix: {
    strain: [
      {
        key: "internalOsStiffness",
        labelKey: "elasto_field_cervix_internal",
        hintKey: "elasto_hint_cervix_internal",
        min: L.stiffness.min,
        max: L.stiffness.max,
        step: 0.01,
        keyboard: "decimal",
      },
      {
        key: "externalOsStiffness",
        labelKey: "elasto_field_cervix_external",
        hintKey: "elasto_hint_cervix_external",
        min: L.stiffness.min,
        max: L.stiffness.max,
        step: 0.01,
        keyboard: "decimal",
      },
      {
        key: "gestationalWeeks",
        labelKey: "elasto_field_gestational_weeks",
        hintKey: "elasto_hint_gestational_weeks",
        unit: "нед",
        min: L.weeks.min,
        max: L.weeks.max,
        step: 1,
        optional: true,
        keyboard: "numeric",
      },
    ],
  },
  myometrium: {
    shear_wave: [
      {
        key: "lesionYoungModulusKpa",
        labelKey: "elasto_field_lesion_kpa",
        hintKey: "elasto_hint_lesion_kpa",
        unit: "кПа",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "referenceMyometriumKpa",
        labelKey: "elasto_field_ref_myometrium_kpa",
        hintKey: "elasto_hint_ref_myometrium_kpa",
        unit: "кПа",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        keyboard: "decimal",
      },
    ],
  },
  ovary: {
    strain: [
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio",
        hintKey: "elasto_hint_strain_ratio_ovary",
        min: L.strain.min,
        max: L.strain.max,
        step: 0.1,
        keyboard: "decimal",
      },
    ],
    shear_wave: [
      {
        key: "youngModulusKpa",
        labelKey: "elasto_field_young_kpa",
        hintKey: "elasto_hint_young_kpa_ovary",
        unit: "кПа",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        keyboard: "decimal",
      },
    ],
    both: [
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio",
        hintKey: "elasto_hint_strain_ratio_ovary",
        min: L.strain.min,
        max: L.strain.max,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "youngModulusKpa",
        labelKey: "elasto_field_young_kpa",
        hintKey: "elasto_hint_young_kpa_ovary",
        unit: "кПa",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
    ],
  },
  breast: {
    strain: [
      {
        key: "tsukubaScore",
        labelKey: "elasto_field_tsukuba",
        hintKey: "elasto_hint_tsukuba",
        min: L.tsukuba.min,
        max: L.tsukuba.max,
        step: 1,
        keyboard: "numeric",
      },
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio_fat",
        hintKey: "elasto_hint_strain_ratio_breast",
        min: L.strain.min,
        max: L.strain.max,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
    ],
    shear_wave: [
      {
        key: "emaxKpa",
        labelKey: "elasto_field_emax",
        hintKey: "elasto_hint_emax",
        unit: "кПа",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "lesionSizeMm",
        labelKey: "elasto_field_lesion_size",
        hintKey: "elasto_hint_lesion_size",
        unit: "мм",
        min: L.sizeMm.min,
        max: L.sizeMm.max,
        step: 1,
        optional: true,
        keyboard: "numeric",
      },
      {
        key: "lesionDepthMm",
        labelKey: "elasto_field_lesion_depth",
        hintKey: "elasto_hint_lesion_depth",
        unit: "мм",
        min: L.depthMm.min,
        max: L.depthMm.max,
        step: 1,
        optional: true,
        keyboard: "numeric",
      },
    ],
    both: [
      {
        key: "tsukubaScore",
        labelKey: "elasto_field_tsukuba",
        hintKey: "elasto_hint_tsukuba",
        min: L.tsukuba.min,
        max: L.tsukuba.max,
        step: 1,
        keyboard: "numeric",
      },
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio_fat",
        hintKey: "elasto_hint_strain_ratio_breast",
        min: L.strain.min,
        max: L.strain.max,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
      {
        key: "emaxKpa",
        labelKey: "elasto_field_emax",
        hintKey: "elasto_hint_emax",
        unit: "кПа",
        min: L.kPa.min,
        max: L.kPa.max,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
    ],
  },
};
