import { getEnv } from "@/lib/env";

import { sendSmsc } from "./smsc";
import { sendSmsRu } from "./smsru";

export { generateOtpCode, hashOtpCode, normalizePhoneRu, formatPhoneRuDisplay, verifyOtpHash } from "./otp";
export { checkSmsSendRateLimit } from "./rate-limit";
export { mapSmsRuErrorCode, SMS_RATE_LIMIT_HOUR, SMS_RATE_LIMIT_MINUTE } from "./errors";

/** Отправка OTP SMS через настроенный провайдер. */
export async function sendOtpSms(
  phone: string,
  code: string,
): Promise<{ ok: boolean; errorCode?: string; message?: string }> {
  const text = `SonoGyn: код ${code}. Действует 5 мин. Не сообщайте код никому.`;
  const provider = getEnv().SMS_PROVIDER;

  if (provider === "smsc") {
    const r = await sendSmsc(phone, text);
    return r.ok
      ? { ok: true }
      : { ok: false, errorCode: r.errorCode, message: "Не удалось отправить SMS." };
  }

  const r = await sendSmsRu(phone, text);
  return r.ok ? { ok: true } : { ok: false, errorCode: r.errorCode, message: r.message };
}
