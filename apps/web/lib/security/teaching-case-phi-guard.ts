import { detectPhi, PHI_BLOCK_MESSAGE } from "@/lib/security/phi-detection";

export type TeachingCasePhiFields = {
  title?: string;
  description?: string | null;
  anatomy?: string | null;
  pathology?: string | null;
};

export type TeachingCasePhiAssessment =
  | { ok: true }
  | { ok: false; reasons: string[] };

/** Scan teaching case free text before create/publish (no real patient identifiers). */
export function assessTeachingCasePhi(fields: TeachingCasePhiFields): TeachingCasePhiAssessment {
  const parts: string[] = [];
  if (fields.title?.trim()) parts.push(fields.title);
  if (fields.description?.trim()) parts.push(fields.description);
  if (fields.anatomy?.trim()) parts.push(fields.anatomy);
  if (fields.pathology?.trim()) parts.push(fields.pathology);

  const combined = parts.join("\n");
  if (!combined) return { ok: true };

  const check = detectPhi(combined);
  if (check.ok) return { ok: true };
  return { ok: false, reasons: check.reasons };
}

export const TEACHING_CASE_PHI_REJECT_MESSAGE =
  `${PHI_BLOCK_MESSAGE} Учебный кейс должен быть обезличенным.`;
