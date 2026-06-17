import type { SmsProviderId, SmsSendResult } from "./types";
import { readSmsRuConfig, sendSmsRu } from "./smsru";

export type { SmsSendResult, SmsProviderId } from "./types";

function readTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

/** Какой SMS-провайдер активен (приоритет: env SMS_PROVIDER → smsru → twilio). */
export function resolveSmsProvider(): SmsProviderId | null {
  const forced = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (forced === "smsru" && readSmsRuConfig()) return "smsru";
  if (forced === "twilio" && readTwilioConfig()) return "twilio";
  if (forced === "mock" && process.env.NODE_ENV !== "production") return "mock";

  if (readSmsRuConfig()) return "smsru";
  if (readTwilioConfig()) return "twilio";
  if (process.env.NODE_ENV !== "production") return "mock";
  return null;
}

export function isCustomSmsAuthEnabled(): boolean {
  const p = resolveSmsProvider();
  return p === "smsru" || p === "twilio";
}

async function sendTwilio(params: { toE164: string; code: string }): Promise<SmsSendResult> {
  const twilio = readTwilioConfig();
  if (!twilio) return { ok: false, errorCode: "sms_not_configured" };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: params.toE164,
    From: twilio.fromNumber,
    Body: `SonoGyn Pro: код ${params.code}. Действует 5 мин. Не сообщайте код.`,
  });
  const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (res.ok) {
    const json = (await res.json().catch(() => null)) as { sid?: string } | null;
    return { ok: true, providerMessageId: json?.sid, provider: "twilio" };
  }
  if (res.status >= 500) return { ok: false, errorCode: "sms_provider_5xx" };
  return { ok: false, errorCode: "sms_provider_error" };
}

/** Отправка OTP-SMS (SMS.ru для РФ или Twilio). */
export async function dispatchSmsOtp(params: { toE164: string; code: string }): Promise<SmsSendResult> {
  const provider = resolveSmsProvider();
  if (provider === "smsru") return sendSmsRu(params);
  if (provider === "twilio") return sendTwilio(params);
  if (provider === "mock") {
    console.info("[auth:sms] mock_sent", { to: params.toE164.replace(/\d(?=\d{4})/g, "*") });
    return { ok: true, providerMessageId: "mock-sms", provider: "mock" };
  }
  return { ok: false, errorCode: "sms_not_configured" };
}
