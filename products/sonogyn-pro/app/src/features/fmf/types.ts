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
  nasalBone?: "seen" | "not_seen" | "uncertain";
  dvFlow?: "normal" | "abnormal" | "unknown";
  tricuspidRegurg?: "none" | "present" | "unknown";
  fhr?: number;
  pappA?: number;
  betaHcg?: number;
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
  stomachSeen?: boolean;
  bladderSeen?: boolean;
  placentaDistanceToOsCm?: number;
  afiCm?: number;
  cervixLengthMm?: number;
  uterinePiMean?: number;
  uaPi?: number;
  mcaPi?: number;
  dvPi?: number;
};

export type AssistantOutput = {
  nextPrompt: string;
  alerts: string[];
  hypotheses: string[];
  conclusion: string;
  recommendations: string[];
  visualHints: string[];
  missingQuestions: string[];
};
