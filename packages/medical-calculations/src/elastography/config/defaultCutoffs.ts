/** Cut-off значения эластографии. Синхронизированы с EFSUMB 2024, WFUMB 2023. */

/** Cut-off CCI для шейки матки (strain). */
export const CERVIX_CCI = {
  soft: { max: 0.5 },
  intermediate: { min: 0.5, max: 0.7 },
  firm: { min: 0.7 },
} as const;

/** Cut-off SWE для миометрия. */
export const MYOMETRIUM_SWE = {
  adenomyosis: { min: 20, max: 40, ratioMin: 1.0, ratioMax: 1.3 },
  fibroid: { min: 45 },
  ratioCutoff: 1.5,
} as const;

/** Cut-off эластографии яичников. */
export const OVARY_ELASTO = {
  strain: { benign: 3.0, malignant: 5.0 },
  swe: { benign: 30, malignant: 50 },
} as const;

/** Cut-off эластографии молочной железы. */
export const BREAST_ELASTO = {
  tsukuba: { benign: [1, 2] as const, intermediate: 3, malignant: [4, 5] as const },
  strain: { benign: 3.0, malignant: 5.0 },
  emax: { benign: 80, malignant: 160 },
} as const;

/** Цвета категорий риска (Material Design). */
export const RISK_COLORS = {
  low: "#43A047",
  intermediate: "#FB8C00",
  high: "#E53935",
} as const;

export type RiskColors = {
  low: string;
  intermediate: string;
  high: string;
};

export type CervixCciCutoffs = {
  soft: { max: number };
  intermediate: { min: number; max: number };
  firm: { min: number };
};

export type MyometriumSweCutoffs = {
  adenomyosis: { min: number; max: number; ratioMin: number; ratioMax: number };
  fibroid: { min: number };
  ratioCutoff: number;
};

export type OvaryElastoCutoffs = {
  strain: { benign: number; malignant: number };
  swe: { benign: number; malignant: number };
};

export type BreastElastoCutoffs = {
  tsukuba: { benign: readonly [number, number]; intermediate: number; malignant: readonly [number, number] };
  strain: { benign: number; malignant: number };
  emax: { benign: number; malignant: number };
};

/** Полный набор cut-off для dependency injection в калькуляторы. */
export type ElastographyCutoffs = {
  RISK_COLORS: RiskColors;
  CERVIX_CCI: CervixCciCutoffs;
  MYOMETRIUM_SWE: MyometriumSweCutoffs;
  OVARY_ELASTO: OvaryElastoCutoffs;
  BREAST_ELASTO: BreastElastoCutoffs;
};

/** Вшитые cut-off по умолчанию (fallback без Remote Config). */
export const DEFAULT_ELASTOGRAPHY_CUTOFFS: ElastographyCutoffs = {
  RISK_COLORS,
  CERVIX_CCI,
  MYOMETRIUM_SWE,
  OVARY_ELASTO,
  BREAST_ELASTO,
};
