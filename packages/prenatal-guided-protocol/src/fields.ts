import { z } from "zod";

/** Anatomy checklist item: empty / ok / abnormal note. */
export const AnatomyStatusSchema = z.enum(["", "ok", "abnormal", "not_assessed"]);
export type AnatomyStatus = z.infer<typeof AnatomyStatusSchema>;

const optionalNum = z.union([z.number(), z.nan()]).optional().nullable();
const optionalStr = z.string().optional().nullable();

/** DZM / Astraia-like T1 field bag — values empty by default; no PHI. */
export const GuidedT1FieldsSchema = z.object({
  examDate: optionalStr,
  facility: optionalStr,
  scanner: optionalStr,
  probe: optionalStr,
  visualization: optionalStr,
  parity: optionalNum,
  pretermBirths16to30: optionalNum,
  maternalWeightKg: optionalNum,
  maternalHeightCm: optionalNum,
  smoking: optionalStr,
  diabetes: optionalStr,
  chronicHypertension: optionalStr,
  sle: optionalStr,
  aps: optionalStr,
  conception: optionalStr,
  lmpDate: optionalStr,
  eddByLmp: optionalStr,
  gaByCrlWeeks: optionalNum,
  gaByCrlDays: optionalNum,
  eddByUs: optionalStr,
  fhrBpm: optionalNum,
  crlMm: optionalNum,
  ntMm: optionalNum,
  bpdMm: optionalNum,
  hcMm: optionalNum,
  dvPi: optionalNum,
  chorionLocation: optionalStr,
  amnioticFluid: optionalStr,
  cordVessels: optionalStr,
  cordInsertion: optionalStr,
  nasalBone: optionalStr,
  anatomyHead: AnatomyStatusSchema.default(""),
  anatomySpine: AnatomyStatusSchema.default(""),
  anatomyHeart: AnatomyStatusSchema.default(""),
  anatomyAbdomen: AnatomyStatusSchema.default(""),
  anatomyStomach: AnatomyStatusSchema.default(""),
  anatomyBladderKidneys: AnatomyStatusSchema.default(""),
  anatomyArms: AnatomyStatusSchema.default(""),
  anatomyLegs: AnatomyStatusSchema.default(""),
  freeBhcgIu: optionalNum,
  freeBhcgMom: optionalNum,
  pappaIu: optionalNum,
  pappaMom: optionalNum,
  uterinePiMean: optionalNum,
  uterinePiMom: optionalNum,
  mapMmHg: optionalNum,
  mapMom: optionalNum,
  cervicalLengthMm: optionalNum,
  conclusion: optionalStr,
  recommendations: optionalStr,
});
export type GuidedT1Fields = z.infer<typeof GuidedT1FieldsSchema>;

/** DZM / Astraia-like T2+ field bag. */
export const GuidedT2FieldsSchema = z.object({
  examDate: optionalStr,
  facility: optionalStr,
  scanner: optionalStr,
  probe: optionalStr,
  visualization: optionalStr,
  gaWeeks: optionalNum,
  gaDays: optionalNum,
  eddByUs: optionalStr,
  eddByLmp: optionalStr,
  bpdMm: optionalNum,
  ofdMm: optionalNum,
  hcMm: optionalNum,
  acMm: optionalNum,
  flMm: optionalNum,
  hlMm: optionalNum,
  cerebellumMm: optionalNum,
  cisternaMagnaMm: optionalNum,
  posteriorHornMm: optionalNum,
  efwGrams: optionalNum,
  efwPercentile: optionalNum,
  fhrBpm: optionalNum,
  fetalMovements: optionalStr,
  fetalLie: optionalStr,
  placentaLocation: optionalStr,
  placentaThicknessMm: optionalNum,
  amnioticFluid: optionalStr,
  mvpCm: optionalNum,
  afiCm: optionalNum,
  cordVessels: optionalStr,
  anatomyHead: AnatomyStatusSchema.default(""),
  anatomyBrain: AnatomyStatusSchema.default(""),
  anatomyFace: AnatomyStatusSchema.default(""),
  anatomyNeck: AnatomyStatusSchema.default(""),
  anatomyChest: AnatomyStatusSchema.default(""),
  anatomyHeart: AnatomyStatusSchema.default(""),
  anatomyAbdominalWall: AnatomyStatusSchema.default(""),
  anatomyGi: AnatomyStatusSchema.default(""),
  anatomyGu: AnatomyStatusSchema.default(""),
  anatomyLimbs: AnatomyStatusSchema.default(""),
  humerusLMm: optionalNum,
  humerusRMm: optionalNum,
  femurLMm: optionalNum,
  femurRMm: optionalNum,
  ulnaLMm: optionalNum,
  ulnaRMm: optionalNum,
  tibiaLMm: optionalNum,
  tibiaRMm: optionalNum,
  uterinePiLeft: optionalNum,
  uterinePiRight: optionalNum,
  uterinePiMean: optionalNum,
  uaPi: optionalNum,
  cervicalLengthMm: optionalNum,
  internalOsShape: optionalStr,
  maternalUterusOvaries: optionalStr,
  conclusion: optionalStr,
  recommendations: optionalStr,
});
export type GuidedT2Fields = z.infer<typeof GuidedT2FieldsSchema>;

export type GuidedFields = GuidedT1Fields | GuidedT2Fields;

export function emptyT1Fields(): GuidedT1Fields {
  return GuidedT1FieldsSchema.parse({
    crlMm: null,
    ntMm: null,
    fhrBpm: null,
    anatomyHead: "",
    anatomySpine: "",
    anatomyHeart: "",
    anatomyAbdomen: "",
    anatomyStomach: "",
    anatomyBladderKidneys: "",
    anatomyArms: "",
    anatomyLegs: "",
    conclusion: "",
    recommendations: "",
  });
}

export function emptyT2Fields(): GuidedT2Fields {
  return GuidedT2FieldsSchema.parse({
    bpdMm: null,
    hcMm: null,
    acMm: null,
    flMm: null,
    anatomyHead: "",
    anatomyBrain: "",
    anatomyFace: "",
    anatomyNeck: "",
    anatomyChest: "",
    anatomyHeart: "",
    anatomyAbdominalWall: "",
    anatomyGi: "",
    anatomyGu: "",
    anatomyLimbs: "",
    conclusion: "",
    recommendations: "",
  });
}

export function isT1Window(windowId: string): boolean {
  return windowId === "early" || windowId === "t1_screening";
}
