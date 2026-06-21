/** Российская адаптация TI-RADS (Катрич и др., 2023) — категории 1–5. */

export type TiradsRuCategory = "1" | "2" | "3" | "4" | "5";

export type TiradsRuComposition =
  | "none"
  | "simple_cyst"
  | "spongiform"
  | "mixed_cystic_solid"
  | "solid";

export type TiradsRuEchogenicity =
  | "anechoic"
  | "iso_hyper"
  | "hypoechoic"
  | "markedly_hypoechoic";

export type TiradsRuShape = "wider" | "round" | "taller";

export type TiradsRuMargin =
  | "smooth"
  | "ill_defined"
  | "irregular"
  | "lobulated"
  | "microlobulated";

export type TiradsRuCalcification = "none" | "macro" | "rim" | "micro";

export type TiradsRuVascularization = "none" | "peripheral" | "intranodular" | "pathological";

export type TiradsRuElastographyMode = "none" | "strain" | "sw2";

export type TiradsRuInput = {
  composition: TiradsRuComposition;
  echogenicity: TiradsRuEchogenicity;
  shape: TiradsRuShape;
  margin: TiradsRuMargin;
  calcification: TiradsRuCalcification;
  vascularization?: TiradsRuVascularization;
  largestDiameterMm?: number;
  /** Смешанный узел с жидким и твёрдым компонентом (важно для TI-RADS 3). */
  cysticWithSolidComponent?: boolean;
  /** Подозрение на метастазы регионарных ЛУ (усиливает показания к ТАБ). */
  suspiciousLymphNodes?: boolean;
  elastography?: {
    mode: TiradsRuElastographyMode;
    /** Повышенная жёсткость по strain / SWE — для TI-MDS. */
    stiff?: boolean;
    emeanKpa?: number;
    emaxKpa?: number;
    stiffnessIndex?: number;
  };
  /** Группа риска (семейный анамнез, облучение, ПЭТ-активность и др. — см. пособие). */
  highRiskPatient?: boolean;
};

export type TiradsRuResult = {
  category: TiradsRuCategory;
  categoryLabel: string;
  malignancyRiskPercent: string;
  fnaRecommended: boolean;
  fnaRationale: string;
  followUp: string;
  tiMdsHint?: string;
  majorSigns: string[];
  minorSigns: string[];
  rationale: string[];
};

export type BethesdaCategory =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "not_done";
