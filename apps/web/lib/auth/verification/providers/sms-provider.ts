import { dispatchSmsOtp, type SmsSendResult } from "@/lib/auth/sms-providers";
import { withTimeout } from "../with-timeout";

export type { SmsSendResult } from "@/lib/auth/sms-providers/types";

const SMS_TIMEOUT_MS = 10_000;

/** SMS OTP: SMS.ru (РФ) → Twilio → mock в dev. */
export async function sendVerificationSms(params: {
  toE164: string;
  code: string;
}): Promise<SmsSendResult> {
  return withTimeout(dispatchSmsOtp(params), SMS_TIMEOUT_MS, "sms");
}
