/**
 * EMR (copilot) vs teaching gallery — data scope constants for reviews and tests.
 * EMR rows are owner-scoped via `created_by`; teaching cases via `cases.user_id` + RLS.
 */

/** Postgres tables in the clinical copilot / EMR path (owner-scoped). */
export const EMR_OWNER_SCOPED_TABLES = [
  "patients",
  "studies",
  "ultrasound_series",
  "ultrasound_images",
  "multimodal_documents",
  "measurements",
  "ai_findings",
  "reports",
  "annotations",
] as const;

/** Next.js API route prefixes that expose EMR data (must require auth + owner filter). */
export const EMR_API_ROUTE_PREFIXES = [
  "/api/patients",
  "/api/copilot",
  "/api/studies",
  "/api/reports",
] as const;

/** Teaching gallery — separate from EMR patient charts. */
export const TEACHING_API_ROUTE_PREFIXES = ["/api/cases"] as const;

/**
 * Contract: patient-scoped HTTP handlers must filter by authenticated user id
 * (Supabase `created_by` or explicit `.eq("created_by", user.id)`).
 */
export const EMR_PATIENT_LIST_OWNER_FILTER = 'eq("created_by", user.id)' as const;

export const EMR_PATIENT_DETAIL_OWNER_FILTERS = [
  'eq("id", patientId)',
  'eq("created_by", user.id)',
] as const;
