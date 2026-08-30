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
import { ClinicalPreferencesSchema } from "./clinical-preferences";

export {
  ClinicalPreferencesSchema,
  DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE,
  NotificationPreferencesSchema,
  SecondThirdProtocolTemplateIdSchema,
  isMessageNotificationsEnabled,
  parseClinicalPreferences,
  type ClinicalPreferences,
  type NotificationPreferences,
  type SecondThirdProtocolTemplateId,
} from "./clinical-preferences";

export {
  BIRTH_DATE_MIN_AGE,
  BIRTH_DATE_MAX_AGE,
  ageFromBirthDateIso,
  birthDateErrorMessage,
  birthDatePickerBounds,
  formatAgeYearsRu,
  formatBirthDateRu,
  isoFromDate,
  normalizeBirthDateInput,
  parseIsoBirthDate,
  parseRuBirthDate,
  resolveBirthDateIso,
  validateBirthDateIso,
  type BirthDateValidationError,
  type ParsedBirthDate,
} from "./birth-date";

export {
  NAVIGATION_CONFIG,
  NAVIGATION_ITEM_COUNT,
  NAVIGATION_DOMAIN_LABELS,
  NAVIGATION_DOMAIN_ORDER,
  NavigationConfigSchema,
  NavigationDomainSchema,
  NavigationIconNameSchema,
  NavigationItemSchema,
  HOME_TILE_NAVIGATION_ORDER,
  enrichNavigationItems,
  getHomeTileNavigation,
  getNavigationGroupedByDomain,
  getNavigationByCategory,
  getNavigationByDomain,
  getNavigationById,
  getNavigationBySlug,
  getNavigationItemUrl,
  validateNavigationConfig,
  type NavigationConfig,
  type NavigationDomain,
  type NavigationDomainSection,
  type NavigationIconName,
  type NavigationItem,
} from "./navigation.config";

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

export const UserRoleSchema = z.enum(["user", "moderator", "author", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SubscriptionTierSchema = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const ProfileRowSchema = z.object({
  id: z.string().uuid(),
  role: UserRoleSchema.default("user"),
  full_name: z.string().nullable(),
  institution: z.string().nullable(),
  specialization: z.string().nullable(),
  birth_year: z.number().int().nullable().optional(),
  clinical_preferences: z.record(z.unknown()).default({}),
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
    birth_year: z.coerce.number().int().min(1900).max(2100).optional(),
    /** ISO YYYY-MM-DD — stored in auth user_metadata.birth_date */
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "birth_date must be ISO YYYY-MM-DD")
      .optional(),
    /** Relative path inside bucket `clinical-avatars`, must start with `{userId}/`. */
    avatar_storage_path: z.string().max(512).optional(),
    /** Частичное обновление клинических настроек (merge в profiles.clinical_preferences). */
    clinical_preferences: ClinicalPreferencesSchema.partial().optional(),
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
  /** NULL = teaching library; NOT NULL = colleague question in a channel section. */
  channel_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type CaseRow = z.infer<typeof CaseRowSchema>;

export const TeachingCaseCommentRowSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  author_id: z.string().uuid(),
  body: z.string(),
  is_best_answer: z.boolean(),
  media_storage_path: z.string().nullable(),
  media_type: z.enum(["image", "video"]).nullable(),
  created_at: z.string().datetime(),
});
export type TeachingCaseCommentRow = z.infer<typeof TeachingCaseCommentRowSchema>;

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

/** Write path: only anonymized clinical context — no patient PHI. */
export const AnonymizedPatientMetaSchema = z
  .object({
    lmp: OptionalIsoDateStringSchema,
    notes: clinicalPlainText(4000).optional(),
  })
  .strict();
export type AnonymizedPatientMeta = z.infer<typeof AnonymizedPatientMetaSchema>;

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

export const CreatePatientBodySchema = z
  .object({
    display_label: z
      .string()
      .min(1)
      .max(120)
      .refine(isPlainClinicalText, "Недопустимые символы в метке кейса"),
    meta: AnonymizedPatientMetaSchema.optional(),
  })
  .strict();
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
  /** Sanitized HTML narrative (TipTap); plain `conclusion` kept for legacy PDF/search. */
  conclusion_html: z.string().max(12000).optional(),
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

// --- AI Chat --------------------------------------------------------------------

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatCompletionRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
  stream: z.boolean().default(false),
});
export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

// --- Structured Reporting Engine (Phase 1) ------------------------------------

export {
  AdnexBloodFlowSchema,
  AdnexClassificationSchema,
  AdnexIotaColorScoreSchema,
  AdnexLesionKindSchema,
  AdnexLocalizationSchema,
  AdnexMeasurementSchema,
  AdnexMenopauseSchema,
  AdnexMorphologySchema,
  AdnexSolidTypeSchema,
  AdnexStructureSchema,
  AdnexStructuredReportInputSchema,
  CreateStructuredReportBodySchema,
  GenerateStructuredReportRequestSchema,
  GenerateStructuredReportResponseSchema,
  ListReportTemplatesQuerySchema,
  ObstetricBiometrySchema,
  ObstetricStructuredReportInputSchema,
  OradsCategorySchema,
  ThyroidCompositionSchema,
  ThyroidEchogenicFociSchema,
  ThyroidEchogenicitySchema,
  ThyroidMarginSchema,
  ThyroidMeasurementSchema,
  ThyroidMorphologySchema,
  ThyroidShapeSchema,
  ThyroidStructuredReportInputSchema,
  ReportCitationSchema,
  ReportDocumentStatusSchema,
  ReportDomainSchema,
  ReportEngineVersionSchema,
  ReportLocaleSchema,
  ReportModalitySchema,
  ReportPatientIdentifierTypeSchema,
  ReportTemplateFieldSchema,
  ReportTemplateFieldTypeSchema,
  ReportTemplateRowSchema,
  ReportTemplateSchema,
  StructuredReportBlocksSchema,
  StructuredReportDocumentSchema,
  StructuredReportEditedBlocksSchema,
  StructuredReportFindingSchema,
  StructuredReportInputSchema,
  StructuredReportOutputSchema,
  StructuredReportPatientStubSchema,
  StructuredReportRowSchema,
  StructuredReportStudyStubSchema,
  UpdateStructuredReportBodySchema,
  type AdnexStructuredReportInput,
  type CreateStructuredReportBody,
  type GenerateStructuredReportRequest,
  type GenerateStructuredReportResponse,
  type ListReportTemplatesQuery,
  type ObstetricStructuredReportInput,
  type ThyroidStructuredReportInput,
  type ReportCitation,
  type ReportDocumentStatus,
  type ReportDomain,
  type ReportEngineVersion,
  type ReportLocale,
  type ReportTemplate,
  type ReportTemplateField,
  type ReportTemplateRow,
  type StructuredReportBlocks,
  type StructuredReportDocument,
  type StructuredReportEditedBlocks,
  type StructuredReportFinding,
  type StructuredReportInput,
  type StructuredReportOutput,
  type StructuredReportPatientStub,
  type StructuredReportRow,
  type StructuredReportStudyStub,
  type UpdateStructuredReportBody,
} from "./structured-reporting";

export {
  ListTeachingCasesQuerySchema,
  ListTeachingCasesResponseSchema,
  TeachingCaseListItemSchema,
  TeachingCaseStatusSchema,
  TeachingCaseTopicSchema,
  TeachingCaseFeedModeSchema,
  CaseLifecycleStatusSchema,
  parseTeachingCaseTags,
  type ListTeachingCasesQuery,
  type ListTeachingCasesResponse,
  type TeachingCaseListItem,
  type TeachingCaseStatus,
  type TeachingCaseTopic,
  type TeachingCaseFeedMode,
  type CaseLifecycleStatus,
} from "./teaching-cases";

export {
  CreateOradsEventBodySchema,
  OradsAgeSourceSchema,
  OradsAssistPlatformSchema,
  OradsEventFeedbackBodySchema,
  OradsMenopauseSourceSchema,
  OradsProtocolDraftSourceSchema,
  OradsTreePathStepSchema,
  OradsWizardHintSchema,
  type CreateOradsEventBody,
  type OradsAgeSource,
  type OradsAssistPlatform,
  type OradsEventFeedbackBody,
  type OradsMenopauseSource,
  type OradsProtocolDraftSource,
} from "./orads-events";

export {
  CreateIfcpcExamBodySchema,
  IfcpcColposcopyExamSchema,
  IfcpcExamResponseSchema,
  IfcpcNomenclatureResponseSchema,
  IfcpcSignLookupQuerySchema,
  UpdateIfcpcExamBodySchema,
  type CreateIfcpcExamBody,
  type IfcpcColposcopyExam,
  type IfcpcColposcopyExamInput,
  type IfcpcExamAssessment,
  type IfcpcNomenclatureResponse,
  type IfcpcSectionDefinition,
  type IfcpcSectionId,
  type IfcpcSignDefinition,
  type IfcpcSignLookupQuery,
  type UpdateIfcpcExamBody,
} from "./ifcpc-expert";

export {
  CALCULATOR_ALGORITHM_CATALOG,
  CalculatorSystemSchema,
  STRUCTURED_CASE_SECTION_IDS,
  STRUCTURED_CASE_TEMPLATE_VERSION,
  STRUCTURED_PROTOCOL_SECTION_IDS,
  STRUCTURED_PROTOCOL_TEMPLATE_VERSION,
  StructuredCalculatorBlockSchema,
  StructuredCaseDocumentSchema,
  StructuredCaseSectionIdSchema,
  StructuredDocumentVersionSchema,
  StructuredMediaRefSchema,
  StructuredProtocolDraftSchema,
  StructuredProtocolSectionIdSchema,
  StructuredSectionContentSchema,
  UpsertStructuredCaseBodySchema,
  UpsertStructuredProtocolDraftBodySchema,
  emptyStructuredCaseDocument,
  emptyStructuredProtocolDraft,
  emptyStructuredSection,
  type CalculatorSystem,
  type StructuredCalculatorBlock,
  type StructuredCaseDocument,
  type StructuredCaseSectionId,
  type StructuredCaseSections,
  type StructuredDocumentVersion,
  type StructuredMediaRef,
  type StructuredProtocolDraft,
  type StructuredProtocolSectionId,
  type StructuredProtocolSections,
  type StructuredSectionContent,
  type UpsertStructuredCaseBody,
  type UpsertStructuredProtocolDraftBody,
} from "./structured-clinical-editor";

export {
  CASE_CONFIRMATION_METHOD_LABELS,
  CASE_LIFECYCLE_TRANSITIONS,
  CaseCommentReactionEmojiSchema,
  CaseConfirmationMethodSchema,
  CaseDiscussionRoleSchema,
  CaseLifecycleActionSchema,
  CaseLifecycleEventSchema,
  CaseLifecycleTransitionBodySchema,
  CaseReportBodySchema,
  REACTION_EMOJI,
  TeachingCaseCommentBodySchema,
  canTransitionLifecycle,
  type CaseCommentReactionEmoji,
  type CaseConfirmationMethod,
  type CaseDiscussionRole,
  type CaseLifecycleAction,
  type CaseLifecycleEvent,
  type CaseLifecycleTransitionBody,
  type CaseReportBody,
  type TeachingCaseCommentBody,
} from "./case-discussions";
