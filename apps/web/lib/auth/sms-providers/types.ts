export type SmsSendResult =
  | { ok: true; providerMessageId?: string; provider?: string }
  | { ok: false; errorCode: string };

export type SmsProviderId = "twilio" | "smsru" | "mock";
