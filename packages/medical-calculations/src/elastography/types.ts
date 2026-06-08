/** Орган / зона исследования */
export type ElastographyOrgan = "cervix" | "myometrium" | "ovary" | "breast" | "abdomen_liver";

/** Метод эластографии */
export type ElastographyMethod = "strain" | "shear_wave" | "both";

/** Категория риска по результату расчёта */
export type RiskCategory = "low" | "intermediate" | "high";

/** Тип образования миометрия */
export type MyometriumLesionType = "fibroid" | "adenomyosis" | "unclear";

/** IOTA-тип adnexal образования */
export type OvaryIotaType = "cyst" | "endometrioma" | "solid";

/** Производитель SWE-платформы */
export type ShearWaveVendor = "generic" | "siemens" | "supersonic" | "ge" | "canon";

/** Результат калькулятора эластографии */
export type ElastographyCalculatorResult = {
  value: number;
  riskCategory: RiskCategory;
  colorHex: string;
  conclusion: string;
  recommendation: string;
  details: Record<string, unknown>;
  integrationHints?: {
    biradsHint?: string;
    oradsHint?: string;
    rmiHint?: string;
  };
};

/** Входные данные: шейка матки (strain) */
export type CervixInput = {
  internalOsStiffness: number;
  externalOsStiffness: number;
  gestationalWeeks?: number;
};

/** Входные данные: миометрий (SWE) */
export type MyometriumInput = {
  lesionYoungModulusKpa: number;
  referenceMyometriumKpa: number;
  lesionType: MyometriumLesionType;
};

/** Входные данные: яичники */
export type OvaryInput = {
  strainRatio?: number;
  youngModulusKpa?: number;
  iotaType: OvaryIotaType;
  method: ElastographyMethod;
};

/** Входные данные: молочная железа */
export type BreastInput = {
  tsukubaScore?: number;
  strainRatio?: number;
  emaxKpa?: number;
  lesionSizeMm?: number;
  lesionDepthMm?: number;
  method: ElastographyMethod;
};

/** Дискриминированный union входа калькулятора по органу */
export type ElastographyInput =
  | { organ: "cervix"; data: CervixInput }
  | { organ: "myometrium"; data: MyometriumInput }
  | { organ: "ovary"; data: OvaryInput }
  | { organ: "breast"; data: BreastInput };
