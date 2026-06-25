/** Вход движка дифференциальной диагностики (Woodward / SonoGyn Pro). */

export type GestationalAgeInput = {
  weeks?: number;
  days?: number;
};

export type BiometricData = {
  bpdMm?: number;
  hcMm?: number;
  acMm?: number;
  flMm?: number;
  hlMm?: number;
  efwGrams?: number;
  /** Atrial width mm — для вентрикуломегалии */
  lateralVentricleMm?: number;
};

export type DopplerData = {
  /** Umbilical artery PI */
  uaPi?: number;
  /** Middle cerebral artery PI */
  mcaPi?: number;
  /** Ductus venosus PI */
  dvPi?: number;
  /** Uterine artery PI (mean) */
  utaPi?: number;
  /** Пульсационный индекс — generic */
  pi?: number;
  ri?: number;
  sdRatio?: number;
  vessel?: "UA" | "MCA" | "DV" | "UTA" | string;
  notes?: string;
};

export type DifferentialInput = {
  gestationalAge?: GestationalAgeInput;
  /** Свободный текст или структурированные находки врача */
  findings: string[];
  biometricData?: BiometricData;
  dopplerData?: DopplerData | DopplerData[];
};

export type DifferentialResultItem = {
  diagnosis: string;
  diagnosisEn: string;
  pathologyId: string;
  confidence: number;
  supportingFindings: string[];
  missingFindings: string[];
  nextSteps: string[];
  category: string;
  bookPage?: number;
};

export type DifferentialOutput = DifferentialResultItem[];

/** Нормализованный клинический токен находки */
export type FindingToken = string;
