import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SMS_PROVIDER: z.enum(["smsru", "smsc"]).default("smsru"),
  SMSRU_API_ID: z.string().optional(),
  SMSRU_FROM: z.string().optional(),
  SMSC_LOGIN: z.string().optional(),
  SMSC_PASSWORD: z.string().optional(),
  SMS_OTP_TTL_SEC: z.coerce.number().default(300),
  SMS_OTP_LENGTH: z.coerce.number().default(6),
  SMS_OTP_PEPPER: z.string().optional(),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_TEST_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),
  HTTP_RETRY_ATTEMPTS: z.coerce.number().default(3),
  HTTP_FETCH_TIMEOUT_MS: z.coerce.number().default(15_000),
  HTTP_RETRY_BASE_DELAY_MS: z.coerce.number().default(500),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

function resolveAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
}

/** Валидация env при первом обращении (server-only). */
export function getEnv(): AppEnv {
  if (cached) return cached;

  const secret = resolveAuthSecret();
  if (!secret || secret.length < 16) {
    throw new Error("Invalid environment: AUTH_SECRET or NEXTAUTH_SECRET (min 16 chars) is required");
  }

  const parsed = envSchema.safeParse({
    ...process.env,
    AUTH_SECRET: secret,
    NEXTAUTH_SECRET: secret,
    AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function isYooKassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim());
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_ADMIN_CHAT_ID?.trim());
}
