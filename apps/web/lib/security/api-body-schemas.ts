import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_ULTRASOUND_IMAGE_BYTES } from "@/lib/security/file-validation";
import { ALLOWED_VIDEO_MIME, MAX_LESSON_VIDEO_BYTES } from "@/lib/storage/config";

/** POST /api/auth/forgot-password */
export const ForgotPasswordBodySchema = z.object({
  email: z.string().trim().email({ message: "Некорректный email." }).max(320),
});

/** POST /api/auth/update-password */
export const UpdatePasswordBodySchema = z.object({
  password: z.string().min(8, "Пароль не короче 8 символов.").max(128),
});

/** POST /api/auth/sign-in */
export const SignInBodySchema = z.object({
  email: z.string().trim().email({ message: "Некорректный email." }).max(320),
  password: z.string().min(1, "Укажите пароль.").max(128),
  turnstileToken: z.string().max(4096).optional(),
});

export type SignInBody = z.infer<typeof SignInBodySchema>;

/** POST /api/auth/sign-up */
export const SignUpBodySchema = z.object({
  email: z.string().trim().email({ message: "Некорректный email." }).max(320),
  password: z.string().min(1, "Укажите пароль.").max(128),
  full_name: z.string().trim().min(1, "Укажите имя и фамилию.").max(200),
  specialization: z.string().trim().min(1, "Выберите специализацию.").max(120),
  institution: z.string().trim().max(200).optional(),
  preferred_locale: z.string().trim().max(16).optional(),
  birth_year: z.union([z.number().int(), z.string().max(4)]).optional(),
  birth_date: z.string().trim().max(32).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type SignUpBody = z.infer<typeof SignUpBodySchema>;

const SAFE_UPLOAD_FILE_NAME = /^[\w.\-()+ ]{1,180}$/;

/** POST /api/copilot/images/register */
export const CopilotImageRegisterBodySchema = z.object({
  studyId: z.string().uuid(),
  seriesId: z.string().uuid(),
  storagePath: z.string().min(1).max(512),
  fileName: z
    .string()
    .min(1)
    .max(200)
    .regex(SAFE_UPLOAD_FILE_NAME, "Недопустимое имя файла"),
  contentType: z.string().max(128).nullable().optional(),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(MAX_ULTRASOUND_IMAGE_BYTES)
    .nullable()
    .optional(),
  modalityHint: z.string().max(64).nullable().optional(),
  frameIndex: z.number().int().min(0).max(9999).nullable().optional(),
});

export type CopilotImageRegisterBody = z.infer<typeof CopilotImageRegisterBodySchema>;

const COPILOT_STUDY_TYPES = [
  "ob_gyn_general",
  "ob_fetal",
  "ob_doppler",
  "gyn_pelvic",
  "gyn_ovarian",
  "gyn_endometrial",
  "cervix",
  "placenta",
  "iugr_workup",
  "other",
] as const;

/** POST /api/copilot/studies */
export const CopilotStudyCreateBodySchema = z.object({
  title: z.string().trim().max(200).optional(),
  studyType: z.enum(COPILOT_STUDY_TYPES).optional(),
  patientDisplayLabel: z.string().trim().max(200).optional(),
});

export type CopilotStudyCreateBody = z.infer<typeof CopilotStudyCreateBodySchema>;

/** POST /api/copilot/studies/[studyId]/series */
export const CopilotSeriesCreateBodySchema = z.object({
  label: z.string().trim().max(200).optional(),
  planeOrRegion: z.string().trim().max(120).optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

export type CopilotSeriesCreateBody = z.infer<typeof CopilotSeriesCreateBodySchema>;

/** Shared registration fields (phone / Telegram OTP). */
export const RegistrationMetadataFieldsSchema = z.object({
  full_name: z.string().trim().max(200).optional(),
  preferred_locale: z.string().trim().max(16).optional(),
  specialization: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(200).optional(),
  birth_year: z.union([z.number().int(), z.string().max(4)]).optional(),
  birth_date: z.string().trim().max(32).optional(),
});

/** POST /api/auth/pilot/register-intent */
export const PilotRegisterIntentBodySchema = RegistrationMetadataFieldsSchema.extend({
  full_name: z.string().trim().min(1, "Укажите ФИО.").max(200),
  specialization: z.string().trim().min(1, "Выберите специализацию.").max(120),
  telegramId: z.string().trim().max(32).optional(),
  next: z.string().trim().max(256).optional(),
});

export type PilotRegisterIntentBody = z.infer<typeof PilotRegisterIntentBodySchema>;

/** POST /api/auth/telegram/verify-otp */
export const TelegramVerifyOtpBodySchema = RegistrationMetadataFieldsSchema.extend({
  chatId: z.string().trim().max(32).optional(),
  telegramId: z.string().trim().max(32).optional(),
  token: z.string().trim().max(12).optional(),
  code: z.string().trim().max(12).optional(),
  createUser: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.chatId?.trim() && !data.telegramId?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Укажите Telegram ID.", path: ["chatId"] });
  }
  if (!data.token?.trim() && !data.code?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Укажите код.", path: ["code"] });
  }
});

export type TelegramVerifyOtpBody = z.infer<typeof TelegramVerifyOtpBodySchema>;

/** POST /api/auth/telegram — Login Widget */
export const TelegramWidgetBodySchema = z.object({
  id: z.union([z.number().int().positive(), z.string().max(32)]),
  first_name: z.string().max(200).optional(),
  last_name: z.string().max(200).optional(),
  username: z.string().max(64).optional(),
  photo_url: z.string().max(2048).optional(),
  auth_date: z.union([z.number().int(), z.string().max(16)]).optional(),
  hash: z.string().min(1).max(128),
  source: z.string().max(32).optional(),
});

/** POST /api/auth/telegram/bot — server-to-server */
export const TelegramBotBodySchema = z.object({
  id: z.union([z.number().int().positive(), z.string().max(32)]),
  first_name: z.string().max(200).optional(),
  last_name: z.string().max(200).optional(),
  username: z.string().max(64).optional(),
  photo_url: z.string().max(2048).optional(),
  auth_date: z.union([z.number().int(), z.string().max(16)]).optional(),
  hash: z.string().max(128).optional(),
  source: z.string().max(32).optional(),
});

/** POST /api/auth/phone/send-otp */
export const PhoneSendOtpBodySchema = RegistrationMetadataFieldsSchema.extend({
  phone: z.string().trim().min(5, "Укажите номер телефона.").max(24),
  createUser: z.boolean().optional(),
  turnstileToken: z.string().max(4096).optional(),
  fallbackEmail: z.union([z.string().trim().email().max(320), z.literal("")]).optional(),
});

/** POST /api/auth/phone/verify-otp */
export const PhoneVerifyOtpBodySchema = RegistrationMetadataFieldsSchema.extend({
  phone: z.string().trim().min(5, "Укажите номер телефона.").max(24),
  token: z.string().trim().max(12).optional(),
  code: z.string().trim().max(12).optional(),
  createUser: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.token?.trim() && !data.code?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Укажите код.", path: ["code"] });
  }
});

/** POST /api/payment/create · /api/yookassa/create */
export const PaymentCreateBodySchema = z.object({
  amountRub: z.number().min(1).max(1_000_000).optional(),
  description: z.string().min(3).max(200).optional(),
  returnUrl: z.string().url().max(2048).optional(),
});

/** POST /api/auth/mobile/exchange */
export const MobileExchangeBodySchema = z.object({
  exchangeCode: z.string().trim().min(1, "Код обмена не указан.").max(128),
});

export type MobileExchangeBody = z.infer<typeof MobileExchangeBodySchema>;

/** POST /api/payment/webhook — ЮKassa notification */
export const YooKassaWebhookBodySchema = z.object({
  type: z.string().max(64),
  event: z.string().max(128),
  object: z.object({
    id: z.string().trim().min(1).max(64),
    status: z.string().max(32).optional(),
    amount: z
      .object({
        value: z.string().max(32).optional(),
        currency: z.string().max(8).optional(),
      })
      .optional(),
    metadata: z.record(z.string().max(512)).optional(),
  }),
});

export type YooKassaWebhookBody = z.infer<typeof YooKassaWebhookBodySchema>;

const VerificationMethodSchema = z.enum(["email", "sms", "telegram"]);
const VerificationPurposeSchema = z.enum(["register", "login", "mfa", "password_reset"]);

/** POST /api/auth/send-code */
export const SendCodeBodySchema = z.object({
  method: VerificationMethodSchema,
  contact: z.string().trim().min(3).max(320),
  fallbackEmail: z.union([z.string().trim().email().max(320), z.literal("")]).optional(),
  /** Пилот: дублировать тот же код по SMS на +7 (при входе через Telegram). */
  backupPhone: z.string().trim().max(24).optional(),
  purpose: VerificationPurposeSchema.optional(),
  turnstileToken: z.string().max(4096).optional(),
});

/** POST /api/auth/verify-code */
export const VerifyCodeBodySchema = z.object({
  method: VerificationMethodSchema,
  contact: z.string().trim().min(3).max(320),
  code: z.string().trim().min(4).max(12),
  purpose: VerificationPurposeSchema.optional(),
});

/** POST /api/auth/resend-confirmation */
export const ResendConfirmationBodySchema = z.object({
  email: z.string().trim().email({ message: "Некорректный email." }).max(320),
  turnstileToken: z.string().max(4096).optional(),
});

/** POST /api/auth/mfa/verify-login */
export const MfaVerifyLoginBodySchema = z.object({
  factorId: z.string().trim().min(1).max(128),
  code: z.string().trim().min(4).max(12),
  session: z
    .object({
      access_token: z.string().min(1).max(4096),
      refresh_token: z.string().min(1).max(4096),
    })
    .optional(),
});

/** POST /api/notify — internal admin Telegram facade */
export const InternalNotifyBodySchema = z.object({
  event: z.string().trim().min(1).max(64),
  message: z.string().trim().min(1).max(4096),
  metadata: z.record(z.unknown()).optional(),
});

const clinicalModuleIdSchema = z.enum(["orads", "iota", "birads", "tirads", "fmf", "general"]);

export const AchievementCheckBodySchema = z.object({
  eventType: z.enum([
    "case_complete",
    "lesson_complete",
    "quiz_pass",
    "interpretation",
    "daily_login",
    "module_progress",
  ]),
  moduleId: clinicalModuleIdSchema,
  correct: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  passed: z.boolean().optional(),
  fmfCompleted: z.number().int().min(0).optional(),
  fmfTotal: z.number().int().min(0).optional(),
});

export type AchievementCheckBody = z.infer<typeof AchievementCheckBodySchema>;

/** POST /api/ai/nosology-assist */
export const NosologyAssistBodySchema = z.object({
  context: z.object({
    code: z.string().trim().max(16).optional(),
    title: z.string().trim().min(1, "context.title обязателен.").max(300),
    group: z.string().trim().max(120).optional(),
    mode: z.enum(["gynecology", "obstetrics"]).optional(),
    ultrasoundFocus: z.array(z.string().max(200)).max(20).optional(),
    redFlags: z.array(z.string().max(200)).max(20).optional(),
    visitChecklist: z.array(z.string().max(200)).max(30).optional(),
    protocolHints: z.array(z.string().max(300)).max(20).optional(),
    voiceProfile: z.enum(["general", "fmf"]).optional(),
  }),
  userNotes: z.string().max(8000).optional(),
  voiceTranscript: z.string().max(12000).optional(),
  imageMetrics: z
    .object({
      width: z.number().finite().positive(),
      height: z.number().finite().positive(),
      darkRatio: z.number().finite().min(0).max(1),
      peripheralRingScore: z.number().finite().min(0).max(1),
    })
    .optional(),
  mediaType: z.enum(["image", "video_frame", "none"]).optional(),
});

export type NosologyAssistBody = z.infer<typeof NosologyAssistBodySchema>;

const ovaryMarkerKindSchema = z.enum([
  "follicle",
  "dominant_follicle",
  "cyst_functional",
  "cyst_hemorrhagic",
  "cyst_dermoid",
  "cyst_endometrioma",
  "solid_component",
  "other",
]);

/** POST /api/ai/ovary-assist */
export const OvaryAssistBodySchema = z.object({
  morphology: z.enum(["normal", "enlarged", "multifollicular", "polycystic_pattern"]),
  markers: z
    .array(
      z.object({
        id: z.string().max(64),
        side: z.enum(["left", "right"]),
        point: z.object({ x: z.number().finite(), y: z.number().finite() }),
        kind: ovaryMarkerKindSchema,
        sizeMm: z.number().finite().positive().max(500).optional(),
        stroke: z
          .array(z.object({ x: z.number().finite(), y: z.number().finite() }))
          .max(64)
          .optional(),
      }),
    )
    .max(50)
    .default([]),
  menopausalStatus: z.enum(["premenopause", "perimenopause", "postmenopause", "unknown"]).optional(),
  cycleDay: z.number().int().min(1).max(45).optional(),
  ovaryVolumeMl: z.number().finite().positive().max(500).optional(),
  afcCount: z.number().int().min(0).max(100).optional(),
  userNotes: z.string().max(8000).optional(),
  imageMetrics: z
    .object({
      width: z.number().finite().positive(),
      height: z.number().finite().positive(),
      darkRatio: z.number().finite().min(0).max(1),
      peripheralRingScore: z.number().finite().min(0).max(1),
    })
    .optional(),
  mediaType: z.enum(["image", "video_frame", "none"]).optional(),
});

export type OvaryAssistBody = z.infer<typeof OvaryAssistBodySchema>;

/** POST /api/ai/structured-report */
export const StructuredReportBodySchema = z.object({
  studyNotes: z.string().max(4000).optional(),
  calculatorOutputs: z.record(z.unknown()).optional(),
});

export type StructuredReportBody = z.infer<typeof StructuredReportBodySchema>;

/** POST /api/webhooks/video/hls-complete */
export const VideoTranscodeWebhookBodySchema = z.object({
  lessonId: z.string().uuid(),
  hlsPlaylistKey: z.string().min(1).max(512),
  secret: z.string().max(256).optional(),
});

export type VideoTranscodeWebhookBody = z.infer<typeof VideoTranscodeWebhookBodySchema>;

const SAFE_UPLOAD_FILE_NAME_VIDEO = /^[\w.\-()+ ]{1,255}$/;

/** POST /api/author/.../video/upload/init */
export const AuthorVideoUploadInitBodySchema = z.object({
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(SAFE_UPLOAD_FILE_NAME_VIDEO, "Недопустимое имя файла"),
  fileSize: z.number().int().min(1).max(MAX_LESSON_VIDEO_BYTES),
  mimeType: z.string().min(1).max(128).refine((v) => ALLOWED_VIDEO_MIME.has(v), {
    message: "Допустимы только video/mp4 и video/webm.",
  }),
});

/** POST /api/author/.../video/upload/blob/complete */
export const AuthorVideoBlobCompleteBodySchema = z.object({
  url: z.string().url().max(2048),
  mimeType: z.string().min(1).max(128).refine((v) => ALLOWED_VIDEO_MIME.has(v), {
    message: "Допустимы только video/mp4 и video/webm.",
  }),
  fileSize: z.number().int().positive().max(MAX_LESSON_VIDEO_BYTES),
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(SAFE_UPLOAD_FILE_NAME_VIDEO, "Недопустимое имя файла"),
});

/** POST /api/author/.../video/upload/sign-part */
export const AuthorVideoMultipartSignPartBodySchema = z.object({
  key: z.string().min(1).max(512),
  uploadId: z.string().min(1).max(256),
  partNumber: z.number().int().min(1).max(10_000),
});

/** POST /api/author/.../video/upload/complete */
export const AuthorVideoMultipartCompleteBodySchema = z.object({
  key: z.string().min(1).max(512),
  uploadId: z.string().min(1).max(256),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().min(1).max(10_000),
        ETag: z.string().min(1).max(256),
      }),
    )
    .min(1)
    .max(10_000),
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(SAFE_UPLOAD_FILE_NAME_VIDEO, "Недопустимое имя файла"),
  fileSize: z.number().int().positive().max(MAX_LESSON_VIDEO_BYTES),
  mimeType: z.string().min(1).max(128).refine((v) => ALLOWED_VIDEO_MIME.has(v), {
    message: "Допустимы только video/mp4 и video/webm.",
  }),
});

/** Vercel Blob client upload token request (passthrough, size-capped). */
export const AuthorVideoBlobUploadBodySchema = z
  .record(z.unknown())
  .refine((v) => JSON.stringify(v).length <= 65_536, { message: "Payload too large." });

/** POST /api/auth/dev-login — optional JSON body */
export const DevLoginPostBodySchema = z.object({
  next: z.string().max(256).optional(),
});

/** E2E fixtures — bounded override fields */
export const E2eAppointmentCreateBodySchema = z
  .object({
    time: z.string().max(64).optional(),
    complaints: z.string().max(4000).optional(),
    anamnesis: z.string().max(4000).optional(),
    plan: z.string().max(4000).optional(),
  })
  .passthrough()
  .refine((v) => JSON.stringify(v).length <= 8192, { message: "Body too large." });

export const E2ePatientRecordPatchBodySchema = z
  .object({
    display_label: z.string().max(200).optional(),
    external_ref: z.string().max(120).optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough()
  .refine((v) => JSON.stringify(v).length <= 8192, { message: "Body too large." });

export async function parseJsonBody(request: Request): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 }),
    };
  }
}

/** Like parseJsonBody but treats empty body as `{}`. */
export async function parseJsonBodyOrEmpty(request: Request): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse }
> {
  const text = await request.text();
  if (!text.trim()) return { ok: true, data: {} };
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 }),
    };
  }
}

export function zodErrorResponse(error: z.ZodError, status = 400) {
  return NextResponse.json({ error: error.flatten() }, { status });
}
