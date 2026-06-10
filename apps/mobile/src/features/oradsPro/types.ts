export type Localization = "ovarian" | "extraovarian";
export type Menopause = "pre" | "post";
export type LesionKind = "physiological" | "nonphysiological";
export type PhysiologicalType = "follicle" | "corpus_luteum";
export type Structure = "unilocular" | "multilocular" | "solid";
export type SeptaCount = "0" | "1-3" | ">3";
export type SeptaThickness = "thin" | "thick";
export type SolidType = "smooth" | "irregular" | "papillary";
export type Echogenicity = "anechoic" | "hypo" | "iso" | "hyper";
export type BloodFlow = "none" | "minimal" | "moderate" | "marked";
export type IotaLesionType =
  | "unilocular_cyst"
  | "unilocular_solid_cyst"
  | "multilocular_cyst"
  | "multilocular_solid_cyst"
  | "solid_tumor"
  | "not_classifiable";
export type PapillaryProjectionCount = "0" | "1" | "2" | "3" | "4plus";
export type PapillaryProjectionSurface = "smooth" | "irregular";
export type IotaColorScore = "1" | "2" | "3" | "4";
export type IotaCenterType = "oncology" | "other";

export type UnilocularSubtype =
  | "simple_cyst"
  | "hemorrhagic"
  | "endometrioma"
  | "dermoid"
  | "paraovarian"
  | "peritoneal_inclusion"
  | "hydrosalpinx"
  | "other";

export type OradsInput = {
  localization?: Localization;
  menopause?: Menopause;
  lesionKind?: LesionKind;
  physiologicalType?: PhysiologicalType;
  structure?: Structure;
  unilocularSubtype?: UnilocularSubtype;
  customDescription?: string;
  septaCount?: SeptaCount;
  septaThickness?: SeptaThickness;
  solidComponent?: boolean;
  solidType?: SolidType;
  echogenicity?: Echogenicity;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  ascites?: boolean;
  bloodFlow?: BloodFlow;
  peritonealNodules?: boolean;
  iotaLesionType?: IotaLesionType;
  papillaryProjectionCount?: PapillaryProjectionCount;
  papillaryProjectionSurface?: PapillaryProjectionSurface;
  largestSolidDiameterMm?: number;
  cystLoculesOver10?: boolean;
  acousticShadows?: boolean;
  iotaColorScore?: IotaColorScore;
  iotaCenterType?: IotaCenterType;
  /** O-RADS US: неполная перегородка во 2-й плоскости. */
  incompleteSeptum?: boolean;
};

export type OradsResult = {
  category: 1 | 2 | 3 | 4 | 5;
  riskText: string;
  recommendation: string;
  rationale: string;
  volumeMl: number | null;
  warning?: string;
};

export type AIQueueItem = {
  id: string;
  createdAt: number;
  payload: OradsInput;
  retryCount: number;
  lastError?: string;
  nextAttemptAt?: number;
};
