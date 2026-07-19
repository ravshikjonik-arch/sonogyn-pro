export type SetPieceDomain = "gynecology" | "obstetrics";

export type SetPieceReportSection = {
  id: string;
  label: string;
  prompt: string;
};

export type ExamSetPieceScenario = {
  id: string;
  domain: SetPieceDomain;
  titleRu: string;
  level: "student" | "doctor";
  clinicalHistory: string;
  ultrasoundFindings: string;
  reportSections: SetPieceReportSection[];
  differentialOptions: string[];
  correctDifferentialIndex: number;
  sampleReport: string;
  teachingPoints: string[];
  relatedHref?: string;
  relatedLabel?: string;
};
