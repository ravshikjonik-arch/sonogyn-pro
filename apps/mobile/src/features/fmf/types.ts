export type FMFSection = "early" | "first" | "second" | "third";

export type EarlyInput = {
  lmpDate?: string;
  bHcg?: number;
  uterusSize?: string;
  gestationalSacPresent?: boolean;
  msdMm?: number;
  embryoPresent?: boolean;
  crlMm?: number;
  fhr?: number;
  yolkSacSeen?: boolean;
  /** Диаметр желточного мешка (YSD), мм — перцентили малого срока. */
  ysdMm?: number;
  corpusLuteumPresent?: boolean;
  corpusLuteumSizeMm?: number;
  corpusLuteumSide?: "right" | "left";
  pregnancyLocation?: "uterine" | "ectopic" | "unknown";
  retrochorionicHematoma?: boolean;
  sacContourNormal?: boolean;
};

export type FirstTrimesterInput = {
  crlMm?: number;
  ntMm?: number;
  /** Длина носовой кости, мм — для перцентиля I скрининга. */
  nasalBoneLengthMm?: number;
  /** Передне-задний размер IV желудочка, мм — Прил. 11. */
  ivVentricleMm?: number;
  nasalBone?: "seen" | "not_seen" | "uncertain";
  dvFlow?: "normal" | "abnormal" | "unknown";
  tricuspidRegurg?: "none" | "present" | "unknown";
  fhr?: number;
  pappA?: number;
  betaHcg?: number;
  /** ПИ венозного протока — Прил. 40 (FMF). */
  dvPi?: number;
  /** ПИ маточных артерий — Прил. 36. */
  uterinePiRight?: number;
  uterinePiLeft?: number;
  /** DV a-wave (FMF percentile engine). */
  dvAWave?: "positive" | "absent" | "reversed";
  /** TR jet velocity (cm/s). */
  tricuspidVelocityCmS?: number;
  /** TR duration / systole (0–1). */
  tricuspidDurationFraction?: number;
  /** MAP — систолическое / диастолическое давление матери. */
  sbpMmHg?: number;
  dbpMmHg?: number;
  nasalBoneCategory?: "present" | "absent" | "hypoplastic" | "uncertain";
};

export type SecondThirdInput = {
  /** Шапка протокола (шаблон Якубова) */
  patientName?: string;
  patientAge?: number;
  examDate?: string;
  lmpDate?: string;
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  fetalPositionStable?: boolean;
  fetusPresentation?: "cephalic" | "breech" | "transverse";
  bpd?: number;
  ofd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
  hlMm?: number;
  ulMm?: number;
  tlMm?: number;
  footLengthMm?: number;
  fetalLengthCm?: number;
  efwPercentile?: number;
  fhr?: number;
  lateralVentriclesMm?: number;
  cerebellumMm?: number;
  cisternaMagnaMm?: number;
  nasalBoneSeen?: boolean;
  nasalBoneLengthMm?: number;
  prenasalThicknessMm?: number;
  tptNbRatio?: string;
  corpusCallosumLengthMm?: number;
  opticTractThicknessMm?: number;
  cerebellumCrMm?: number;
  cerebellumApMm?: number;
  sylvianDepthMm?: number;
  cerebellarAngleDeg?: number;
  cspWidthMm?: number;
  stomachSeen?: boolean;
  bladderSeen?: boolean;
  placentaDistanceToOsCm?: number;
  placentaLocation?: "anterior" | "posterior" | "lateral" | "fundal";
  /** Толщина плаценты, мм — Прил. 34. */
  placentaThicknessMm?: number;
  afiCm?: number;
  maxVerticalPocketCm?: number;
  cervixLengthMm?: number;
  uterinePiMean?: number;
  uterinePiRight?: number;
  uterinePiLeft?: number;
  fetalSex?: "female" | "male" | "uncertain";
  visualizationQuality?: "satisfactory" | "limited" | "poor";
  uaPi?: number;
  uaRi?: number;
  mcaPi?: number;
  /** ПССК СМА, см/с — Прил. 38 (Mari). */
  mcaPsv?: number;
  dvPi?: number;
  orbitExtraMm?: number;
  orbitIntraMm?: number;
  orbitDiameterMm?: number;
  thymusPerimeterMm?: number;
  thymusTransverseCm?: number;
  leftAtriumMm?: number;
  rightAtriumMm?: number;
  leftVentricleMm?: number;
  rightVentricleMm?: number;
  aortaMm?: number;
};

import type { MedvedevMarkerAssessment } from "./logic/medvedevFirstTrimester";
import type { MedvedevDopplerAssessment } from "./logic/medvedevDoppler";
import type { MedvedevBiometryAssessment } from "./logic/medvedevBiometry";
import type { MedvedevPlacentaAfiAssessment } from "@repo/medvedev-reference";

export type AssistantOutput = {
  nextPrompt: string;
  alerts: string[];
  hypotheses: string[];
  conclusion: string;
  recommendations: string[];
  visualHints: string[];
  missingQuestions: string[];
  /** I скрининг: перцентили фетометрии. */
  medvedevMarkers?: MedvedevMarkerAssessment[];
  /** Допплер: Прил. 40 (DV) и Прил. 36 (UtA). */
  medvedevDoppler?: MedvedevDopplerAssessment[];
  /** II/III скрининг: фетометрия и мозг по Прил. 1. */
  medvedevBiometry?: MedvedevBiometryAssessment[];
  /** Плацента, ИАЖ, пальцы: Прил. 33–35. */
  medvedevPlacentaAfi?: MedvedevPlacentaAfiAssessment[];
  /** Малый срок: MSD / YSD / CRL по референсным кривым. */
  earlyBiometry?: import("@repo/medical-calculations/early-pregnancy").EarlyBiometryAssessment[];
  /** I скрининг: FMF percentile / z / MoM engine. */
  fmfScreening?: import("@repo/fmf").FirstTrimesterScreeningOutput;
};
