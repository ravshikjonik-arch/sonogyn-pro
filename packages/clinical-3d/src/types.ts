import type { Vector3 } from "three";

// ─── Базовые типы ───────────────────────────────────────────────────────────

/** Клиническая аннотация на 3D-модели (координаты в мм относительно органа). */
export interface ClinicalAnnotation<T = Record<string, unknown>> {
  id: string;
  label: string;
  position: Vector3;
  /** Реальные размеры в мм (длина × ширина × высота). */
  size: Vector3;
  color: string;
  opacity: number;
  metadata: T;
}

// ─── Матка (FIGO PALM-COEIN, Munro 2011/2018) ───────────────────────────────

export type FigoType = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export interface FibroidMetadata {
  figoType: FigoType;
  longestDiameter: number;
  volume: number;
  vascularization: "none" | "minimal" | "moderate" | "marked";
  degenerationType?: "hyaline" | "cystic" | "calcified" | "red" | "sarcomatous";
}

export interface FibroidAnnotation extends ClinicalAnnotation<FibroidMetadata> {
  type: "fibroid";
}

export interface AdenomyosisMetadata {
  form: "diffuse" | "focal" | "nodular" | "cystic";
  junctionalZoneThickness: number;
  myometrialInvolvement: "inner" | "middle" | "outer";
  /** IDEA / DIE score — уточняется по локальному протоколу. */
  dieScore?: number;
}

export interface AdenomyosisAnnotation extends ClinicalAnnotation<AdenomyosisMetadata> {
  type: "adenomyosis";
}

// ─── Шейка матки ──────────────────────────────────────────────────────────────

export interface NabothianCystMetadata {
  diameter: number;
  content: "anechoic" | "echoic" | "sediment";
  multiplicity: "single" | "multiple";
}

export interface NabothianCystAnnotation extends ClinicalAnnotation<NabothianCystMetadata> {
  type: "nabothian_cyst";
}

// ─── Яичники (IOTA 2008/2016, O-RADS US v2022) ──────────────────────────────

export type OvarianLesionKind =
  | "follicle"
  | "corpus_luteum"
  | "simple_cyst"
  | "endometrioma"
  | "dermoid"
  | "cystadenoma"
  | "suspicious_mass";

export interface OvarianLesionMetadata {
  iotaCategory?: "B" | "M" | "U";
  oradsCategory: 1 | 2 | 3 | 4 | 5;
  structure: "unilocular" | "multilocular" | "solid" | "solid_cystic";
  solidComponent: boolean;
  papillaryProjections: number;
  ascites: boolean;
  vascularization: "none" | "minimal" | "moderate" | "marked";
  longestDiameter: number;
  volume: number;
}

export interface OvarianLesionAnnotation extends ClinicalAnnotation<OvarianLesionMetadata> {
  type: OvarianLesionKind;
}

// ─── Молочная железа (BI-RADS US 2013/2023) ─────────────────────────────────

export type BreastQuadrant =
  | "upper_outer"
  | "upper_inner"
  | "lower_outer"
  | "lower_inner"
  | "retroareolar";

export interface BreastLesionMetadata {
  biradsCategory: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  quadrant: BreastQuadrant;
  distanceFromNippleMm: number;
  depthFromSkinMm: number;
  shape: "oval" | "round" | "irregular";
  orientation: "parallel" | "non_parallel";
  margin: "circumscribed" | "indistinct" | "angular" | "microlobulated" | "spiculated";
  echoPattern: "anechoic" | "hyperechoic" | "hypoechoic" | "isoechoic" | "heterogeneous";
  posteriorFeatures: "none" | "enhancement" | "shadowing" | "combined";
  calcifications: boolean;
  vascularization: "none" | "internal" | "peripheral";
  /** Tsukuba elastography score 1–5 */
  elastographyScore?: number;
  /** Emax, кПа */
  elastographyEmax?: number;
}

export interface BreastLesionAnnotation extends ClinicalAnnotation<BreastLesionMetadata> {
  type: "breast_lesion";
}

export interface LymphNodeMetadata {
  corticalThickness: number;
  hilumPresent: boolean;
  shape: "oval" | "round";
  lnradsCategory?: 1 | 2 | 3 | 4;
}

export interface LymphNodeAnnotation extends ClinicalAnnotation<LymphNodeMetadata> {
  type: "lymph_node";
}

// ─── Беременность (FMF / INTERGROWTH-21st) ─────────────────────────────────

export interface FetalBiometry {
  /** Недели + доли (20.5 = 20 нед 3–4 дня). */
  gestationalAge: number;
  crl?: number;
  bpd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
  hl?: number;
  nuchalTranslucency?: number;
  nasalBone?: "present" | "absent" | "not_visualized";
  estimatedFetalWeight?: number;
  efwPercentile?: number;
}

export interface FmfReferenceRange {
  parameter: string;
  gestationalWeek: number;
  p5: number;
  p50: number;
  p95: number;
}

export type FmfBiometryParameter = "crl" | "bpd" | "hc" | "ac" | "fl" | "efw";

export type PercentileBand = { p5: number; p50: number; p95: number };

// ─── Общие типы органов ───────────────────────────────────────────────────────

export type OrganKind =
  | "uterus"
  | "cervix"
  | "ovary"
  | "adnexa"
  | "breast"
  | "pregnancy";

export type OrganAnnotation =
  | FibroidAnnotation
  | AdenomyosisAnnotation
  | NabothianCystAnnotation
  | OvarianLesionAnnotation
  | BreastLesionAnnotation
  | LymphNodeAnnotation;
