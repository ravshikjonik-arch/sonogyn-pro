import { logVerificationEvent as obsLogVerification } from "@/lib/observability";

import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";
import { readTelegramBotUsername } from "@/lib/auth/telegram-bot-config";
import { translateSmsRuErrorCode } from "@/lib/auth/sms-providers";
import { TelegramService } from "@/services/telegram";
import { sendVerificationEmail } from "./providers/email-provider";
import { sendVerificationSms } from "./providers/sms-provider";
import {
  sendVerificationTelegram,
  TelegramNotReadyError,
} from "./providers/telegram-provider";
import { logVerificationError } from "./safe-verification-log";
import type { SendVerificationResult, VerificationMethod, VerificationPurpose } from "./types";
import { OperationTimeoutError, sleep } from "./with-timeout";

const MAX_ATTEMPTS = 2;

export type SendVerificationCodeParams = {
  method: VerificationMethod;
  contact: string;
  code: string;
  purpose: VerificationPurpose;
  timeoutMs?: number;
  clientIp?: string;
};

function telegramBotHint(): string {
  const username = readTelegramBotUsername();
  return username ? `@${username}` : "@SonogynProBot";
}

async function dispatchOnce(params: SendVerificationCodeParams): Promise<SendVerificationResult> {
  const purposeLabel =
    params.purpose === "register"
      ? "регистрация"
      : params.purpose === "login"
        ? "вход"
        : params.purpose === "mfa"
          ? "2FA"
          : "сброс пароля";

  const started = Date.now();

  try {
    if (params.method === "email") {
      const result = await sendVerificationEmail({
        to: params.contact,
        code: params.code,
        purposeLabel,
      });
      obsLogVerification("send", "email", result.ok, Date.now() - started, {
        errorCode: result.ok ? undefined : result.errorCode,
      });
      if (!result.ok) {
        logVerificationError("send_failed", result.errorCode, "email");
        return {
          ok: false,
          errorCode: result.errorCode,
          message:
            result.bounce
              ? "Не удалось доставить письмо. Проверьте адрес или выберите другой способ."
              : "Не удалось отправить код на email. Попробуйте позже.",
          suggestAlternateMethod: result.bounce && !isAuthEmailOnly() ? "sms" : undefined,
        };
      }
      return {
        ok: true,
        deliveredVia: "email",
        message: "Если email указан верно, код отправлен. Проверьте «Входящие» и «Спам».",
      };
    }

    if (params.method === "sms") {
      const result = await sendVerificationSms({
        toE164: params.contact,
        code: params.code,
        clientIp: params.clientIp,
      });
      obsLogVerification("send", "sms", result.ok, Date.now() - started, {
        errorCode: result.ok ? undefined : result.errorCode,
      });
      if (!result.ok) {
        logVerificationError("send_failed", result.errorCode, "sms");
        if (process.env.NODE_ENV === "production") {
          TelegramService.notifyAdminsSafe("sms.error", {
            contact: params.contact.replace(/\d(?=\d{4})/g, "*"),
            errorCode: result.errorCode,
            message: translateSmsRuErrorCode(result.errorCode),
            purpose: params.purpose,
          });
        }
        return {
          ok: false,
          errorCode: result.errorCode,
          message: translateSmsRuErrorCode(result.errorCode),
          suggestAlternateMethod:
            result.errorCode === "smsru_non_ru_number" ? "telegram" : "email",
        };
      }
      return {
        ok: true,
        deliveredVia: "sms",
        message: "Если номер подходит, код отправлен по SMS.",
      };
    }

    try {
      const result = await sendVerificationTelegram({ chatId: params.contact, code: params.code });
      obsLogVerification("send", "telegram", result.ok, Date.now() - started, {
        errorCode: result.ok ? undefined : result.errorCode,
      });
      if (!result.ok) {
        logVerificationError("send_failed", result.errorCode, "telegram");
        return {
          ok: false,
          errorCode: result.errorCode,
          message: result.botNotStarted
            ? `Сначала откройте бота ${telegramBotHint()} и нажмите Start.`
            : "Не удалось отправить код в Telegram.",
          suggestAlternateMethod: "email",
        };
      }
      return {
        ok: true,
        deliveredVia: "telegram",
        message: "Код отправлен в Telegram.",
      };
    } catch (e) {
      if (e instanceof TelegramNotReadyError) {
        obsLogVerification("send", "telegram", false, Date.now() - started, {
          errorCode: "TELEGRAM_NOT_READY",
        });
        return {
          ok: false,
          errorCode: "TELEGRAM_NOT_READY",
          message: `Сначала откройте бота ${telegramBotHint()} и нажмите Start.`,
          suggestAlternateMethod: "email",
        };
      }
      throw e;
    }
  } catch (e) {
    const errorCode =
      e instanceof OperationTimeoutError
        ? `${e.label}_timeout`
        : e instanceof Error
          ? e.message
          : "dispatch_error";
    obsLogVerification("send", params.method, false, Date.now() - started, { errorCode });
    logVerificationError("send_exception", errorCode, params.method);
    return {
      ok: false,
      errorCode,
      message: "Сервис отправки не ответил вовремя. Попробуйте другой способ.",
      suggestAlternateMethod: params.method === "email" ? "sms" : "email",
    };
  }
}

/**
 * Универсальная отправка с ретраями (max 2) и экспоненциальной задержкой.
 */
export async function sendVerificationCode(
  params: SendVerificationCodeParams,
): Promise<SendVerificationResult> {
  let delayMs = 400;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await dispatchOnce(params);
    if (result.ok) return result;

    if (attempt < MAX_ATTEMPTS && result.errorCode?.includes("5xx")) {
      await sleep(delayMs);
      delayMs *= 2;
      continue;
    }

    return result;
  }

  return { ok: false, errorCode: "exhausted_retries", message: "Не удалось отправить код." };
}
