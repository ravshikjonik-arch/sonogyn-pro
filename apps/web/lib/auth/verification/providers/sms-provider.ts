import { withTimeout } from "../with-timeout";

export type SmsSendResult = { ok: true; providerMessageId?: string } | { ok: false; errorCode: string };

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

const SMS_TIMEOUT_MS = 10_000;

function readTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

async function sendVerificationSmsInner(params: {
  toE164: string;
  code: string;
}): Promise<SmsSendResult> {
  const twilio = readTwilioConfig();

  if (!twilio) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, errorCode: "sms_not_configured" };
    }
    console.info("[auth:verification] sms_mock_sent");
    return { ok: true, providerMessageId: "mock-sms-id" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: params.toE164,
    From: twilio.fromNumber,
    Body: `SonoGyn Pro: код ${params.code}. Действует 5 мин. Не сообщайте код.`,
  });

  const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (res.ok) {
    const json = (await res.json().catch(() => null)) as { sid?: string } | null;
    return { ok: true, providerMessageId: json?.sid };
  }

  if (res.status >= 500) return { ok: false, errorCode: "sms_provider_5xx" };
  return { ok: false, errorCode: "sms_provider_error" };
}

/** SMS через Twilio, таймаут 10 с. */
export async function sendVerificationSms(params: {
  toE164: string;
  code: string;
}): Promise<SmsSendResult> {
  return withTimeout(sendVerificationSmsInner(params), SMS_TIMEOUT_MS, "sms");
}
