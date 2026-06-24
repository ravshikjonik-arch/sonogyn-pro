import { generateVerificationCode } from "./code-generator";
import { readDevSmsOtpForMock, shouldExposeDevSmsOtp } from "@/lib/auth/dev-sms";
import {
  buildIdempotencyFingerprint,
  checkIdempotency,
  storeVerificationCode,
} from "./code-store";
import { sendVerificationCode } from "./send-verification-code";
import { logVerificationError, logVerificationEvent } from "./safe-verification-log";
import type { SendVerificationResult, VerificationMethod, VerificationPurpose } from "./types";
import { parseEmailContact, parseSmsContact, parseTelegramChatId } from "./validate-contact";

export type FallbackChainParams = {
  primaryMethod: VerificationMethod;
  contact: string;
  purpose: VerificationPurpose;
  /** Email для fallback при Telegram/SMS. */
  fallbackEmail?: string;
  idempotencyKey?: string | null;
};

export type FallbackChainResult = SendVerificationResult & {
  /** Код сохранён в KV и может быть проверен через /api/auth/verify-code */
  codeStored?: boolean;
};

function resolveContact(method: VerificationMethod, raw: string): string | null {
  if (method === "email") return parseEmailContact(raw);
  if (method === "sms") return parseSmsContact(raw);
  return parseTelegramChatId(raw);
}

const IDEMPOTENCY_DUP_MSG =
  "Код уже отправлен. SMS.ru может доставлять до 10 минут — подождите или проверьте email-fallback.";

/**
 * Fallback chain:
 * 1) Telegram → если бот не начат / timeout → Email (fallbackEmail)
 * 2) SMS → timeout/5xx → Email + UI «Код также отправлен на почту»
 * 3) Email bounce → предложить SMS/Telegram
 */
export async function runVerificationFallbackChain(
  params: FallbackChainParams,
): Promise<FallbackChainResult> {
  const contact = resolveContact(params.primaryMethod, params.contact);
  if (!contact) {
    return { ok: false, errorCode: "invalid_contact", message: "Некорректный контакт." };
  }

  const fallbackEmail = params.fallbackEmail ? parseEmailContact(params.fallbackEmail) : null;

  const fingerprint = buildIdempotencyFingerprint({
    purpose: params.purpose,
    method: params.primaryMethod,
    contact,
  });

  const idempotency = await checkIdempotency(params.idempotencyKey ?? null, fingerprint);
  if (idempotency === "duplicate") {
    logVerificationEvent("idempotency_duplicate", { method: params.primaryMethod, purpose: params.purpose });
    const dup: FallbackChainResult = {
      ok: true,
      message: IDEMPOTENCY_DUP_MSG,
      codeStored: true,
    };
    if (shouldExposeDevSmsOtp() && params.primaryMethod === "sms") {
      dup.devOtp = readDevSmsOtpForMock();
    }
    return dup;
  }

  const code = generateVerificationCode();

  await storeVerificationCode({
    purpose: params.purpose,
    contact,
    method: params.primaryMethod,
    code,
  });

  const primary = await sendVerificationCode({
    method: params.primaryMethod,
    contact,
    code,
    purpose: params.purpose,
  });

  if (primary.ok) {
    const out: FallbackChainResult = { ...primary, codeStored: true };
    if (shouldExposeDevSmsOtp() && params.primaryMethod === "sms") {
      out.devOtp = code;
    }
    return out;
  }

  // Telegram: бот не начат / TELEGRAM_NOT_READY → email fallback
  if (
    params.primaryMethod === "telegram" &&
    fallbackEmail &&
    (primary.errorCode === "TELEGRAM_NOT_READY" ||
      primary.errorCode === "telegram_bot_not_started" ||
      primary.errorCode?.includes("telegram"))
  ) {
    logVerificationEvent("fallback_triggered", {
      method: "telegram",
      purpose: params.purpose,
      fallbackUsed: true,
    });

    await storeVerificationCode({
      purpose: params.purpose,
      contact: fallbackEmail,
      method: "email",
      code,
    });

    const emailResult = await sendVerificationCode({
      method: "email",
      contact: fallbackEmail,
      code,
      purpose: params.purpose,
    });

    if (emailResult.ok) {
      return {
        ok: true,
        deliveredVia: "email",
        fallbackUsed: true,
        codeStored: true,
        message:
          "Не удалось отправить в Telegram (откройте бота и нажмите Start). Код отправлен на привязанную почту.",
      };
    }

    logVerificationError("fallback_failed", emailResult.errorCode ?? "unknown", "email");
  }

  // SMS: timeout / 5xx / not configured → email fallback
  if (
    params.primaryMethod === "sms" &&
    fallbackEmail &&
    (primary.errorCode?.includes("sms") ||
      primary.errorCode?.includes("timeout") ||
      primary.errorCode === "sms_not_configured")
  ) {
    logVerificationEvent("fallback_triggered", {
      method: "sms",
      purpose: params.purpose,
      fallbackUsed: true,
    });

    await storeVerificationCode({
      purpose: params.purpose,
      contact: fallbackEmail,
      method: "email",
      code,
    });

    const emailResult = await sendVerificationCode({
      method: "email",
      contact: fallbackEmail,
      code,
      purpose: params.purpose,
    });

    if (emailResult.ok) {
      return {
        ok: true,
        deliveredVia: "email",
        fallbackUsed: true,
        codeStored: true,
        message: "SMS не дошло вовремя. Код также отправлен на email.",
      };
    }
  }

  // Email bounce
  if (primary.errorCode === "email_bounce") {
    return {
      ok: false,
      errorCode: "email_bounce",
      message: "Email недоступен (ошибка доставки). Укажите другой адрес или выберите SMS/Telegram.",
      suggestAlternateMethod: "sms",
      codeStored: true,
    };
  }

  return { ...primary, codeStored: true };
}
