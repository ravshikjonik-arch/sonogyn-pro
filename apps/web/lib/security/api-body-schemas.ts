import { z } from "zod";

import { MAX_ULTRASOUND_IMAGE_BYTES } from "@/lib/security/file-validation";

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

export async function parseJsonBody(request: Request): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: Response }
> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Некорректное тело запроса." }, { status: 400 }),
    };
  }
}

export function zodErrorResponse(error: z.ZodError, status = 400) {
  return Response.json({ error: error.flatten() }, { status });
}
