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
  /** Длина носовой кости, мм — для перцентиля по Медведеву, Прил. 11. */
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
};

export type SecondThirdInput = {
  gaWeeksByLmp?: number;
  gaDaysByLmp?: number;
  fetusPresentation?: "cephalic" | "breech" | "transverse";
  bpd?: number;
  ofd?: number;
  hc?: number;
  ac?: number;
  fl?: number;
  fhr?: number;
  lateralVentriclesMm?: number;
  cerebellumMm?: number;
  cisternaMagnaMm?: number;
  nasalBoneSeen?: boolean;
  nasalBoneLengthMm?: number;
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
  /** Толщина плаценты, мм — Прил. 34. */
  placentaThicknessMm?: number;
  afiCm?: number;
  cervixLengthMm?: number;
  uterinePiMean?: number;
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
  /** I скрининг: перцентили по Медведеву, Прил. 11. */
  medvedevMarkers?: MedvedevMarkerAssessment[];
  /** Допплер: Прил. 40 (DV) и Прил. 36 (UtA). */
  medvedevDoppler?: MedvedevDopplerAssessment[];
  /** II/III скрининг: фетометрия и мозг по Прил. 1. */
  medvedevBiometry?: MedvedevBiometryAssessment[];
  /** Плацента, ИАЖ, пальцы: Прил. 33–35. */
  medvedevPlacentaAfi?: MedvedevPlacentaAfiAssessment[];
};
