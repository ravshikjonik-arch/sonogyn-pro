import { resolveSmsProvider } from "@/lib/auth/sms-providers";

/** Server: dev OTP on screen only when local dev + SMS mock (never production sms.ru). */
export function shouldExposeDevSmsOtp(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return resolveSmsProvider() === "mock";
}

/** Dev mock OTP for duplicate-send idempotency path. */
export function readDevSmsOtpForMock(): string {
  return process.env.DEV_SMS_OTP_CODE?.trim() || "123456";
}
