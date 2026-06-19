export interface TomosynthesisReference {
  $schema: string;
  aliases: string[];
  advantages: string[];
  limitations: string[];
  acquisitionProtocolSteps: string[];
  clinicalIndications: string[];
  uiArchitectureNotes: {
    volumeDataStorage: string;
    viewerRequirement: string;
    annotation: string;
  };
}

export interface ElastographyModality {
  id: string;
  labelRu: string;
  outputType: string;
}

export interface TsukubaTypeScore {
  score: number;
  patternRu: string;
  interpretation: string;
}

export interface RoiGuidance {
  includeSurroundingTissueFactor: number;
  minimizeProbeCompression: boolean;
  useBreathHold: boolean;
}

export interface DeviceDependentThresholds {
  note: string;
  implementationGuidance: string;
}

export interface ElastographyReference {
  $schema: string;
  modalities: ElastographyModality[];
  tsukubaTypeScore: TsukubaTypeScore[];
  roiGuidance: RoiGuidance;
  deviceDependentThresholds: DeviceDependentThresholds;
  clinicalUseCases: string[];
}

export interface CysticLesion {
  id: string;
  labelRu: string;
  suggestedBirads: string;
}

export interface FibroepithelialTumor {
  id: string;
  labelRu: string;
  suggestedBirads?: string;
  note?: string;
}

export interface MalignantSonographicFeatures {
  shape: string;
  margin: string[];
  echoPattern: string;
  orientation: string;
  posteriorFeatures: string;
  vascularity: string[];
}

export interface MolecularSubtypeTendency {
  subtype: string;
  tendencyRu: string;
}

export interface GradeRelatedTendency {
  grade: string;
  tendencyRu: string;
}

export interface MultifocalityTerm {
  id: string;
  labelRu: string;
  definitionRu: string;
}

export interface NodularLesionsReference {
  $schema: string;
  cysticLesions: CysticLesion[];
  fibroepithelialTumors: FibroepithelialTumor[];
  malignantSonographicFeatures: MalignantSonographicFeatures;
  molecularSubtypeSonographicTendencies: MolecularSubtypeTendency[];
  gradeRelatedTendencies: GradeRelatedTendency[];
  multifocalityTerms: MultifocalityTerm[];
  mandatoryChecklistOnSuspiciousFinding: string[];
  disclaimer: string;
}

export interface HistologicalCategory {
  epithelialBenign: string[];
  epithelialMalignant: string[];
  fibroepithelial: string[];
  mesenchymal: string[];
  nippleTumors: string[];
}

export interface Grade {
  code: string;
  labelRu: string;
}

export interface MolecularSubtype {
  id: string;
  labelRu: string;
  er: boolean;
  pr: boolean | string; // 'variable' is a string
  her2: boolean;
  ki67: string | null; // 'low', 'high', 'any', null
}

export interface HistologicalMolecular {
  $schema: string;
  histologicalCategories: HistologicalCategory;
  grades: Grade[];
  molecularSubtypes: MolecularSubtype[];
}

export interface BiradsCategory {
  code: string;
  labelRu: string;
  malignancyRiskPct?: number | null;
  malignancyRiskRangePct?: [number, number];
  recommendationRu: string;
}

export interface BiradsDescriptor {
  shape: string[];
  margin: string[];
  echoPattern: string[];
  orientation: string[];
  posteriorFeatures: string[];
  associatedFeatures: string[];
  calcifications: string[];
}

export interface SimplifiedTriagingRule {
  id: string;
  if?: { [key: string]: string | string[] };
  ifAny?: { [key: string]: string | string[] };
  suggestedCategory: string;
}

export interface BiradsCriteria {
  $schema: string;
  categories: BiradsCategory[];
  descriptors: BiradsDescriptor;
  simplifiedTriagingRules: SimplifiedTriagingRule[];
  disclaimer: string;
}

export interface TnmCategory {
  code: string;
  labelRu: string;
  maxSizeMm?: number;
  minSizeMm?: number;
}

export interface TnmStageGrouping {
  stage: string;
  t: string[];
  n: string[];
  m: string[];
}

export interface TnmStaging {
  $schema: string;
  tCategories: TnmCategory[];
  nCategories: TnmCategory[];
  mCategories: TnmCategory[];
  stageGrouping: TnmStageGrouping[];
  usNodeSuspiciousFeatures: string[];
  note: string;
}

export interface DopplerModality {
  id: string;
  labelRu: string;
  angleDependent: boolean;
}

export interface QuantitativeIndex {
  id: string;
  labelRu: string;
  formula: string;
  suspiciousThreshold?: number;
  suspiciousThresholdHigh?: number; // Added for completeness, if PI also has one
}

export interface VascularityPattern {
  id: string;
  labelRu: string;
  typicalAssociation: string;
}

export interface ScannerSettingsGuidance {
  minimizeProbeCompression: boolean;
  gain: string;
  prf: string;
  optimalDopplerAngleDeg: number;
}

export interface DopplerReference {
  $schema: string;
  modalities: DopplerModality[];
  quantitativeIndices: QuantitativeIndex[];
  vascularityPatterns: VascularityPattern[];
  scannerSettingsGuidance: ScannerSettingsGuidance;
  disclaimer: string;
}

export interface Quadrant {
  id: string;
  labelRu: string;
  relativeTumorFrequencyPct: number;
}

export interface LymphNodeZone {
  id: string;
  labelRu: string;
}

export interface TransducerPreset {
  id: string;
  labelRu: string;
  freqRangeMHz: [number, number];
}

export interface GlandularTissueThicknessReference {
  ageRange: [number, number];
  minMm: number;
  maxMm: number;
}

export interface DevelopmentalAnomaly {
  id: string;
  labelRu: string;
  descriptionRu: string;
}

export interface MenstrualCyclePhaseGuidance {
  recommendedWindow: string;
  cycle28Day: string;
  longerCycle: string;
  note: string;
}

export interface AnatomyReference {
  $schema: string;
  quadrants: Quadrant[];
  lymphNodeZones: LymphNodeZone[];
  transducerPresets: TransducerPreset[];
  glandularTissueThicknessReferenceMm: GlandularTissueThicknessReference[];
  developmentalAnomalies: DevelopmentalAnomaly[];
  menstrualCyclePhaseGuidance: MenstrualCyclePhaseGuidance;
}

