import { resolveSmsProvider } from "@/lib/auth/sms-providers";

/** Server: dev OTP on screen only when local dev + SMS mock (never production sms.ru). */
export function shouldExposeDevSmsOtp(): boolean {
  return process.env.NODE_ENV === "development" && resolveSmsProvider() === "mock";
}

/** Dev mock OTP for duplicate-send idempotency path. */
export function readDevSmsOtpForMock(): string {
  return process.env.DEV_SMS_OTP_CODE?.trim() || "123456";
}
