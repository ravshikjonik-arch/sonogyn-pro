import { getEnv } from "@/lib/env";

import { sendSmsc } from "./smsc";
import { sendSmsRu } from "./smsru";

export { generateOtpCode, hashOtpCode, normalizePhoneRu, verifyOtpHash } from "./otp";

/** Отправка OTP SMS через настроенный провайдер. */
export async function sendOtpSms(phone: string, code: string): Promise<{ ok: boolean; errorCode?: string }> {
  const text = `Код входа: ${code}. Не сообщайте никому.`;
  const provider = getEnv().SMS_PROVIDER;

  if (provider === "smsc") {
    const r = await sendSmsc(phone, text);
    return r.ok ? { ok: true } : { ok: false, errorCode: r.errorCode };
  }

  const r = await sendSmsRu(phone, text);
  return r.ok ? { ok: true } : { ok: false, errorCode: r.errorCode };
}
