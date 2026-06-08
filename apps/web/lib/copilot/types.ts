/** Domain enums and DTOs for the OB/GYN ultrasound copilot data plane. */

export type StudyStatus = "draft" | "in_progress" | "completed" | "archived";

export type StudyType =
  | "ob_gyn_general"
  | "ob_fetal"
  | "ob_doppler"
  | "gyn_pelvic"
  | "gyn_ovarian"
  | "gyn_endometrial"
  | "cervix"
  | "placenta"
  | "iugr_workup"
  | "other";

export type ImageModalityHint =
  | "b_mode"
  | "m_mode"
  | "doppler_spectral"
  | "doppler_color"
  | "3d"
  | "unknown";

export type MultimodalDocType =
  | "report_pdf"
  | "lab_result"
  | "clinical_note"
  | "voice_transcript"
  | "structured_measurements";

export const ULTRASOUND_MEDIA_BUCKET = "ultrasound-media" as const;

export type ClinicalSupportFinding = {
  title: string;
  detail: string;
  confidence?: number;
  evidenceGrade?: "high" | "moderate" | "low" | "unknown";
};

export type ClinicalSupportBundle = {
  framing: "clinical_support_suggestions";
  summary: string;
  findings: ClinicalSupportFinding[];
  followUpSuggestions: string[];
  additionalTestsSuggestions: string[];
  citations: { label: string; href?: string }[];
};
