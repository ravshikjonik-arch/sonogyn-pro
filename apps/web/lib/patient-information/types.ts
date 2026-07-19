export type PatientLeafletId =
  | "short-cervical-length"
  | "o-rads-adnexal"
  | "cin-follow-up"
  | "fetal-growth-restriction"
  | "first-trimester-screening";

export type PatientLeaflet = {
  id: PatientLeafletId;
  titleRu: string;
  subtitle: string;
  source: string;
  relatedHref?: string;
  relatedLabel?: string;
  sections: { heading: string; body: string }[];
  whenToUse: string;
};
