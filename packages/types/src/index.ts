/**
 * @repo/types — shared contracts for web, mobile, API routes, and Supabase rows.
 * Use Zod schemas at API boundaries; export inferred TS types for components.
 */
import { z } from "zod";

import {
  ClinicalPhoneSchema,
  clinicalPlainText,
  ExternalMrnSchema,
  ExternalRefSchema,
  IsoDateStringSchema,
  OmsPolicyNumberSchema,
  OptionalIsoDateStringSchema,
  SafeSnapshotDataUrlSchema,
  SnilsSchema,
  escapeHtmlText,
  escapeLikePattern,
  isSafeClinicalImageDataUrl,
  isValidIsoCalendarDate,
  validateSnilsChecksum,
  isPlainClinicalText,
} from "./clinical-validation";

export {
  ClinicalPhoneSchema,
  clinicalPlainText,
  ExternalMrnSchema,
  ExternalRefSchema,
  IsoDateStringSchema,
  OmsPolicyNumberSchema,
  OptionalIsoDateStringSchema,
  SafeSnapshotDataUrlSchema,
  SnilsSchema,
  escapeHtmlText,
  escapeLikePattern,
  isPlainClinicalText,
  isSafeClinicalImageDataUrl,
  isValidIsoCalendarDate,
  validateSnilsChecksum,
};

// --- RBAC & profiles ------------------------------------------------------------

export const UserRoleSchema = z.enum(["user", "moderator", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SubscriptionTierSchema = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const ProfileRowSchema = z.object({
  id: z.string().uuid(),
  role: UserRoleSchema.default("user"),
  full_name: z.string().nullable(),
  institution: z.string().nullable(),
  specialization: z.string().nullable(),
  subscription_tier: SubscriptionTierSchema.default("free"),
  subscription_expires_at: z.string().datetime().nullable(),
  stripe_customer_id: z.string().nullable(),
  trial_ends_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ProfileRow = z.infer<typeof ProfileRowSchema>;

/** PATCH /api/profile — professional profile fields only (RBAC managed server-side). */
export const UpdateProfileBodySchema = z
  .object({
    full_name: z.string().max(240).optional(),
    institution: z.string().max(240).optional(),
    specialization: z.string().max(240).optional(),
    /** Relative path inside bucket `clinical-avatars`, must start with `{userId}/`. */
    avatar_storage_path: z.string().max(512).optional(),
  })
  .strict();
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;

// --- Teaching cases (gallery) ---------------------------------------------------

export const CaseStatusSchema = z.enum(["draft", "review", "published", "flagged"]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

export const CaseRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  anatomy: z.string().nullable(),
  pathology: z.string().nullable(),
  difficulty: z.string().nullable(),
  is_public: z.boolean(),
  status: CaseStatusSchema,
  flag_reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type CaseRow = z.infer<typeof CaseRowSchema>;

export const CaseMediaTypeSchema = z.enum(["image", "video", "dicom"]);
export type CaseMediaType = z.infer<typeof CaseMediaTypeSchema>;

export const CaseMediaRowSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  storage_path: z.string(),
  media_type: CaseMediaTypeSchema,
  order_index: z.number().int(),
  metadata: z.record(z.unknown()).default({}),
  uploaded_at: z.string().datetime(),
});
export type CaseMediaRow = z.infer<typeof CaseMediaRowSchema>;

// --- AI analyses ----------------------------------------------------------------

export const AiAnalysisStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type AiAnalysisStatus = z.infer<typeof AiAnalysisStatusSchema>;

export const AiAnalysisRowSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  status: AiAnalysisStatusSchema,
  results: z.record(z.unknown()).nullable(),
  error_message: z.string().nullable(),
  requested_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});
export type AiAnalysisRow = z.infer<typeof AiAnalysisRowSchema>;

export const AiAnalyzeRequestSchema = z.object({
  caseId: z.string().uuid(),
  mediaIds: z.array(z.string().uuid()).min(1),
});
export type AiAnalyzeRequest = z.infer<typeof AiAnalyzeRequestSchema>;

// --- Calculator catalog & saved runs -------------------------------------------

export const CalculatorDefinitionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  formula_config: z.record(z.unknown()).default({}),
  inputs: z.record(z.unknown()).default({}),
  outputs: z.record(z.unknown()).default({}),
  user_id: z.string().uuid().nullable(),
});
export type CalculatorDefinitionRow = z.infer<typeof CalculatorDefinitionRowSchema>;

export const SavedResultRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  calculator_id: z.string().uuid().nullable(),
  input_values: z.record(z.unknown()),
  output_values: z.record(z.unknown()),
  created_at: z.string().datetime(),
});
export type SavedResultRow = z.infer<typeof SavedResultRowSchema>;

// --- Stripe subscriptions -------------------------------------------------------

export const SubscriptionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  stripe_subscription_id: z.string(),
  stripe_customer_id: z.string(),
  status: z.string(),
  current_period_start: z.string().datetime().nullable(),
  current_period_end: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type SubscriptionRow = z.infer<typeof SubscriptionRowSchema>;

export const CreateCheckoutBodySchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
export type CreateCheckoutBody = z.infer<typeof CreateCheckoutBodySchema>;

export const RestorePurchasesBodySchema = z.object({
  platform: z.enum(["web", "ios", "android"]).default("web"),
});
export type RestorePurchasesBody = z.infer<typeof RestorePurchasesBodySchema>;

// --- Analytics & audit -----------------------------------------------------------

export const AnalyticsEventRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  event_name: z.string(),
  properties: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});
export type AnalyticsEventRow = z.infer<typeof AnalyticsEventRowSchema>;

export const AuditLogRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  action: z.string(),
  table_name: z.string(),
  record_id: z.string().nullable(),
  old_data: z.record(z.unknown()).nullable(),
  new_data: z.record(z.unknown()).nullable(),
  ip_address: z.string().nullable(),
  timestamp: z.string().datetime(),
});
export type AuditLogRow = z.infer<typeof AuditLogRowSchema>;

export const ProductAnalyticsEventSchema = z.enum([
  "app_open",
  "case_created",
  "ai_used",
  "paywall_opened",
  "subscription_started",
  "elastography_config_error",
]);
export type ProductAnalyticsEvent = z.infer<typeof ProductAnalyticsEventSchema>;

// --- Clinical EMR (patients, studies, protocols) --------------------------------

export const PatientSexSchema = z.enum(["female", "male", "other", "unknown"]);
export type PatientSex = z.infer<typeof PatientSexSchema>;

export const PatientMetaSchema = z.object({
  date_of_birth: OptionalIsoDateStringSchema,
  lmp: OptionalIsoDateStringSchema,
  phone: ClinicalPhoneSchema,
  email: z.string().email().optional(),
  notes: clinicalPlainText(4000).optional(),
  external_mrn: ExternalMrnSchema,
  snils: SnilsSchema,
  oms_policy: OmsPolicyNumberSchema,
});
export type PatientMeta = z.infer<typeof PatientMetaSchema>;

export const PatientRowSchema = z.object({
  id: z.string().uuid(),
  external_ref: z.string().nullable(),
  display_label: z.string(),
  meta: PatientMetaSchema.default({}),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type PatientRow = z.infer<typeof PatientRowSchema>;

export const CreatePatientBodySchema = z.object({
  display_label: z
    .string()
    .min(1)
    .max(240)
    .refine(isPlainClinicalText, "Недопустимые символы в имени"),
  external_ref: ExternalRefSchema,
  meta: PatientMetaSchema.optional(),
});
export type CreatePatientBody = z.infer<typeof CreatePatientBodySchema>;

export const UpdatePatientBodySchema = CreatePatientBodySchema.partial();
export type UpdatePatientBody = z.infer<typeof UpdatePatientBodySchema>;

export const FetusBiometrySchema = z.object({
  crl_mm: z.number().positive().optional(),
  nt_mm: z.number().positive().optional(),
  bpd_mm: z.number().positive().optional(),
  hc_mm: z.number().positive().optional(),
  ac_mm: z.number().positive().optional(),
  fl_mm: z.number().positive().optional(),
  hl_mm: z.number().positive().optional(),
});
export type FetusBiometry = z.infer<typeof FetusBiometrySchema>;

export const DopplerMeasurementsSchema = z.object({
  ua_pi: z.number().optional(),
  ua_ri: z.number().optional(),
  mca_pi: z.number().optional(),
  uterine_pi_left: z.number().optional(),
  uterine_pi_right: z.number().optional(),
});
export type DopplerMeasurements = z.infer<typeof DopplerMeasurementsSchema>;

export const PathologyTypeSchema = z.enum(["myoma", "adenomyosis", "polyp", "scar", "other"]);

export const PathologyAnnotationSchema = z.object({
  id: z.string(),
  type: PathologyTypeSchema,
  position: z.tuple([z.number(), z.number(), z.number()]),
  sizeMm: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    depth: z.number().nonnegative(),
  }),
  comment: clinicalPlainText(500).optional(),
  pedunculated: z.boolean().optional(),
  figoType: z.number().int().min(0).max(8).optional(),
  figoOverride: z.number().int().min(0).max(8).nullable().optional(),
  localizationRu: z.string().optional(),
  layerLabelRu: z.string().optional(),
});

export const UterusVisualizationSchema = z.object({
  modelScale: z.number().min(0.5).max(2),
  annotations: z.array(PathologyAnnotationSchema).default([]),
  snapshotDataUrl: SafeSnapshotDataUrlSchema.optional(),
});
export type UterusVisualization = z.infer<typeof UterusVisualizationSchema>;

export const AmnioticFluidSchema = z.object({
  afi_q1_cm: z.number().min(0).optional(),
  afi_q2_cm: z.number().min(0).optional(),
  afi_q3_cm: z.number().min(0).optional(),
  afi_q4_cm: z.number().min(0).optional(),
  sdp_cm: z.number().min(0).optional(),
});
export type AmnioticFluid = z.infer<typeof AmnioticFluidSchema>;

export const UltrasoundProtocolPayloadSchema = z.object({
  study_date: IsoDateStringSchema,
  lmp: OptionalIsoDateStringSchema,
  ga_days: z.number().int().min(0).optional(),
  biometry: FetusBiometrySchema.default({}),
  doppler: DopplerMeasurementsSchema.default({}),
  amniotic: AmnioticFluidSchema.default({}),
  organs: z
    .object({
      uterus: clinicalPlainText(2000).optional(),
      ovaries: clinicalPlainText(2000).optional(),
      cervix: clinicalPlainText(2000).optional(),
      placenta: clinicalPlainText(2000).optional(),
      fetus: clinicalPlainText(2000).optional(),
      bladder: clinicalPlainText(2000).optional(),
    })
    .default({}),
  diagnosis: clinicalPlainText(2000).optional(),
  conclusion: clinicalPlainText(8000).optional(),
  efw_grams: z.number().int().positive().optional(),
  efw_formula: z.string().optional(),
  uterus_visualization: UterusVisualizationSchema.optional(),
});
export type UltrasoundProtocolPayload = z.infer<typeof UltrasoundProtocolPayloadSchema>;

export const StudyRowSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid().nullable(),
  modality: z.string(),
  study_type: z.string(),
  status: z.string(),
  title: z.string().nullable(),
  meta: z.record(z.unknown()).default({}),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type StudyRow = z.infer<typeof StudyRowSchema>;
