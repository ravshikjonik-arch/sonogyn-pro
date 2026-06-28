/**
 * Константы модуля эластографии.
 * Cut-off: синхронный fallback из defaultConfig + асинхронный Remote Config.
 */

import type { ElastographyMethod, ElastographyOrgan, FieldDefinition, ElastographyReferenceRow } from "./types";

// ─── Remote Config ───────────────────────────────────────────────────────────
export {
  defaultConfig as ELASTOGRAPHY_CUTOFFS,
  BREAST_ELASTO,
  CERVIX_CCI,
  MYOMETRIUM_SWE,
  OVARY_ELASTO,
  RISK_COLORS,
  mapConfigToLegacyCutoffs,
} from "./remoteConfig/defaultConfig";

export {
  getConfig,
  checkForUpdates,
  refreshConfig,
  resetToDefaultConfig,
  getCachedMeta,
  USE_LOCAL_CONFIG,
} from "./remoteConfig/configLoader";

export { useRemoteConfig } from "./remoteConfig/useRemoteConfig";
export { default as ConfigStatusBadge } from "./remoteConfig/ConfigStatusBadge";
export type { ElastographyConfig, UpdateStatus, ConfigResponse } from "./remoteConfig/types";

// ─── Статические UI-константы (не в remote JSON) ─────────────────────────────

/** Диапазоны калибровки приборов (предупреждение) */
export const DEVICE_CALIBRATION = {
  kpa: { softMin: 1, softMax: 180, warnAbove: 200 },
  strainRatio: { min: 0.5, max: 15, warnAbove: 12 },
  cci: { min: 0.05, max: 1.0 },
} as const;

/** Какие методы доступны для органа */
export const ORGAN_METHODS: Record<
  Exclude<ElastographyOrgan, "abdomen_liver">,
  ElastographyMethod[]
> = {
  cervix: ["strain"],
  myometrium: ["shear_wave"],
  ovary: ["strain", "shear_wave", "both"],
  breast: ["strain", "shear_wave", "both"],
};

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
        min: 0,
        max: 1,
        step: 0.01,
        keyboard: "decimal",
      },
      {
        key: "externalOsStiffness",
        labelKey: "elasto_field_cervix_external",
        hintKey: "elasto_hint_cervix_external",
        min: 0.05,
        max: 1,
        step: 0.01,
        keyboard: "decimal",
      },
      {
        key: "gestationalWeeks",
        labelKey: "elasto_field_gestational_weeks",
        hintKey: "elasto_hint_gestational_weeks",
        unit: "нед",
        min: 16,
        max: 42,
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
        min: 1,
        max: 300,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "referenceMyometriumKpa",
        labelKey: "elasto_field_ref_myometrium_kpa",
        hintKey: "elasto_hint_ref_myometrium_kpa",
        unit: "кПа",
        min: 1,
        max: 300,
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
        min: 0.5,
        max: 20,
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
        min: 1,
        max: 200,
        step: 0.1,
        keyboard: "decimal",
      },
    ],
    both: [
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio",
        hintKey: "elasto_hint_strain_ratio_ovary",
        min: 0.5,
        max: 20,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "youngModulusKpa",
        labelKey: "elasto_field_young_kpa",
        hintKey: "elasto_hint_young_kpa_ovary",
        unit: "кПa",
        min: 1,
        max: 200,
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
        min: 1,
        max: 5,
        step: 1,
        keyboard: "numeric",
      },
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio_fat",
        hintKey: "elasto_hint_strain_ratio_breast",
        min: 0.5,
        max: 15,
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
        min: 1,
        max: 500,
        step: 0.1,
        keyboard: "decimal",
      },
      {
        key: "lesionSizeMm",
        labelKey: "elasto_field_lesion_size",
        hintKey: "elasto_hint_lesion_size",
        unit: "мм",
        min: 2,
        max: 80,
        step: 1,
        optional: true,
        keyboard: "numeric",
      },
      {
        key: "lesionDepthMm",
        labelKey: "elasto_field_lesion_depth",
        hintKey: "elasto_hint_lesion_depth",
        unit: "мм",
        min: 1,
        max: 60,
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
        min: 1,
        max: 5,
        step: 1,
        keyboard: "numeric",
      },
      {
        key: "strainRatio",
        labelKey: "elasto_field_strain_ratio_fat",
        hintKey: "elasto_hint_strain_ratio_breast",
        min: 0.5,
        max: 15,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
      {
        key: "emaxKpa",
        labelKey: "elasto_field_emax",
        hintKey: "elasto_hint_emax",
        unit: "кПа",
        min: 1,
        max: 500,
        step: 0.1,
        optional: true,
        keyboard: "decimal",
      },
    ],
  },
};

/** Справочник cut-off (обновляемый JSON-совместимый массив) */
export const REFERENCE_TABLE: ElastographyReferenceRow[] = [
  {
    organ: "cervix",
    parameter: "CCI (внутр./наруж.)",
    lowRisk: "> 0.7",
    intermediate: "0.5 – 0.7",
    highRisk: "< 0.5",
    source: "EFSUMB/WFUMB — cervical strain elastography (consensus)",
  },
  {
    organ: "myometrium",
    parameter: "SWE Ratio (Eобр/Eмио)",
    lowRisk: "зависит от типа",
    intermediate: "1.0 – 1.5",
    highRisk: "миома: >1.5, E>45 кПа",
    source: "Shear wave uterine fibroid literature",
  },
  {
    organ: "ovary",
    parameter: "Strain ratio / E (кПа)",
    lowRisk: "SR<3; E<30",
    intermediate: "SR 3–5; E 30–50",
    highRisk: "SR>5; E>50",
    source: "IOTA/ADNEX correlation; WFUMB adnexal SWE",
  },
  {
    organ: "breast",
    parameter: "Tsukuba / Emax",
    lowRisk: "1–2; Emax<80",
    intermediate: "3; Emax 80–160",
    highRisk: "4–5; Emax>160",
    source: "Tsukuba score; ACR BI-RADS US elastography adjunct",
  },
];

export const ELASTO_DISCLAIMER_KEY = "elasto_disclaimer";
