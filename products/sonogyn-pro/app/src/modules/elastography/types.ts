/** Орган / зона исследования и типы калькулятора — из общего пакета */
export type {
  BreastInput,
  CervixInput,
  ElastographyCalculatorResult,
  ElastographyInput,
  ElastographyMethod,
  ElastographyOrgan,
  MyometriumInput,
  MyometriumLesionType,
  OvaryInput,
  OvaryIotaType,
  RiskCategory,
  ShearWaveVendor,
} from "@repo/medical-calculations/elastography";

/** UI-специфичные типы мобильного модуля */
export type ElastographyWizardStep = "organ" | "method" | "input" | "result";

export type FieldDefinition = {
  key: string;
  labelKey: string;
  hintKey: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  optional?: boolean;
  keyboard: "decimal" | "numeric";
};

export type ElastographyHistoryEntry = {
  id: string;
  createdAt: number;
  patientId?: string;
  patientName?: string;
  organ: import("@repo/medical-calculations/elastography").ElastographyOrgan;
  method: import("@repo/medical-calculations/elastography").ElastographyMethod;
  input: Record<string, unknown>;
  result: import("@repo/medical-calculations/elastography").ElastographyCalculatorResult;
};

export type ElastographyReferenceRow = {
  organ: import("@repo/medical-calculations/elastography").ElastographyOrgan;
  parameter: string;
  lowRisk: string;
  intermediate: string;
  highRisk: string;
  source: string;
};
