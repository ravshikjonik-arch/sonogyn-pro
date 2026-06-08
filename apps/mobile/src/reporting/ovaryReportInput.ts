/** Structured input for ovarian US report text generation (assistive; requires physician verification). */

export type ReportOrgan = "ovary";

export type ReportMenopausalStatus = "reproductive" | "peri" | "post";

export type RomaRiskLevel = "low" | "high";

export type ReportInput = {
  organ: ReportOrgan;
  description: string;
  orads: number;
  /** When omitted or invalid, ROMA paragraph is not included. */
  roma?: number;
  romaRisk: RomaRiskLevel;
  menopausalStatus: ReportMenopausalStatus;
};
