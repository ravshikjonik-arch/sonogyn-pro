/**
 * Централизованный логгер и мониторинг ошибок.
 *
 * Каналы:
 *  - console (JSON в production → попадает в Vercel Logs / Log Drain);
 *  - Telegram (мгновенные уведомления админам при ошибках, особенно критичных);
 *  - Sentry / GlitchTip (опционально, через env — см. примечание про санкции).
 *
 * 152-ФЗ / безопасность: PII и секреты не логируются (redaction).
 *
 * ## Санкции и Sentry
 * Облачный sentry.io может быть недоступен из РФ-инфраструктуры. Поэтому интеграция
 * сделана опциональной и не тянет npm-зависимость: если в проекте установлен `@sentry/*`
 * и задан `SENTRY_DSN`, ошибки уедут туда. Санкционно-безопасная альтернатива —
 * self-hosted **GlitchTip** (Sentry-совместимый, тот же DSN-формат).
 */
import { TelegramService } from "@/services/telegram";

export type LogLevel = "info" | "warn" | "error";

/** Канал критичности — для маршрутизации мгновенных алертов. */
export type LogChannel = "general" | "payment" | "sms" | "auth" | "cron" | "ai-chat";

export type LogContext = Record<string, unknown>;

export type LogErrorOptions = {
  /** Критическая ошибка (платёж/SMS) → мгновенное уведомление в Telegram. */
  critical?: boolean;
  /** Канал для тегирования и алертов. */
  channel?: LogChannel;
  /** Доп. контекст (будет очищен от PII/секретов). */
  context?: LogContext;
  /** Принудительно отправить/не отправлять Telegram-алерт. */
  notifyTelegram?: boolean;
};

const SECRET_KEY_FRAGMENTS = [
  "secret",
  "token",
  "password",
  "authorization",
  "api_key",
  "apikey",
  "bearer",
  "credential",
  "private_key",
  "service_role",
];

const PII_KEY_FRAGMENTS = [
  "display_label",
  "full_name",
  "phone",
  "email",
  "lmp",
  "date_of_birth",
  "birth_date",
  "external_ref",
  "conclusion",
  "diagnosis",
  "patient",
  "snils",
  "polis",
  "code",
  "otp",
];

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    SECRET_KEY_FRAGMENTS.some((p) => k.includes(p)) ||
    PII_KEY_FRAGMENTS.some((p) => k.includes(p))
  );
}

function redactValue(key: string, value: unknown, depth = 0): unknown {
  if (isSensitiveKey(key)) return "[redacted]";
  if (depth > 4) return "[depth-limit]";
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => redactValue("", v, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(k, v, depth + 1);
    }
    return out;
  }
  return value;
}

function redactContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = redactValue(k, v);
  }
  return out;
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function envName(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

/* -------------------------------------------------------------------------- */
/* Счётчик ошибок (для ежедневной сводки).                                     */
/* На serverless это per-instance best-effort: точный учёт — через Log Drain.  */
/* -------------------------------------------------------------------------- */

type ErrorCounters = { error: number; warn: number; critical: number; since: string };

const counters: ErrorCounters = {
  error: 0,
  warn: 0,
  critical: 0,
  since: new Date().toISOString(),
};

export function snapshotAndResetCounters(): ErrorCounters {
  const snapshot = { ...counters };
  counters.error = 0;
  counters.warn = 0;
  counters.critical = 0;
  counters.since = new Date().toISOString();
  return snapshot;
}

export function peekCounters(): ErrorCounters {
  return { ...counters };
}

/* -------------------------------------------------------------------------- */
/* Sentry / GlitchTip — опционально, без жёсткой зависимости.                  */
/* -------------------------------------------------------------------------- */

type MinimalSentry = {
  captureException: (e: unknown, hint?: unknown) => void;
  captureMessage: (m: string, level?: string) => void;
};

function getSentry(): MinimalSentry | null {
  if (!process.env.SENTRY_DSN?.trim()) return null;
  const candidate = (globalThis as { Sentry?: MinimalSentry }).Sentry;
  if (candidate && typeof candidate.captureException === "function") {
    return candidate;
  }
  return null;
}

function captureToSentry(level: LogLevel, message: string, error?: unknown): void {
  const sentry = getSentry();
  if (!sentry) return;
  try {
    if (error) sentry.captureException(error);
    else sentry.captureMessage(message, level);
  } catch {
    // Sentry/GlitchTip недоступен — не мешаем основному потоку.
  }
}

/* -------------------------------------------------------------------------- */
/* Базовая запись в консоль.                                                   */
/* -------------------------------------------------------------------------- */

function emitConsole(
  level: LogLevel,
  message: string,
  context?: LogContext,
  extra?: Record<string, unknown>,
): void {
  const payload = {
    ts: new Date().toISOString(),
    service: "sonogyn-web",
    level,
    message,
    env: envName(),
    ...(context ? { context } : {}),
    ...(extra ?? {}),
  };

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;

  if (isProd()) {
    fn(JSON.stringify(payload));
  } else {
    fn(`[${level}] ${message}`, context ?? "", extra ?? "");
  }
}

/* -------------------------------------------------------------------------- */
/* Публичный API логгера.                                                      */
/* -------------------------------------------------------------------------- */

export function logInfo(message: string, context?: LogContext): void {
  emitConsole("info", message, redactContext(context));
}

export function logWarning(message: string, context?: LogContext): void {
  counters.warn += 1;
  emitConsole("warn", message, redactContext(context));
  captureToSentry("warn", message);
}

/**
 * Логирование ошибки. При `critical: true` (или для каналов payment/sms) —
 * мгновенное уведомление админам в Telegram.
 */
export function logError(message: string, error?: unknown, options: LogErrorOptions = {}): void {
  counters.error += 1;
  const channel = options.channel ?? "general";
  const critical = options.critical ?? (channel === "payment" || channel === "sms");
  if (critical) counters.critical += 1;

  const normalized = normalizeError(error);
  const safeContext = redactContext(options.context);

  emitConsole("error", message, safeContext, {
    channel,
    critical,
    error: normalized.publicShape,
    // Стектрейс — только в логи (Vercel), НИКОГДА в ответ пользователю.
    ...(normalized.stack ? { stack: normalized.stack } : {}),
  });

  captureToSentry("error", message, error);

  const notify = options.notifyTelegram ?? critical;
  if (notify) {
    TelegramService.notifyAdminsSafe("api.error", {
      message,
      channel,
      critical: critical ? "yes" : "no",
      error: normalized.message,
      env: envName(),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Утилиты для безопасной выдачи ошибок наружу.                                */
/* -------------------------------------------------------------------------- */

export const INTERNAL_ERROR_MESSAGE = "Внутренняя ошибка сервера.";

type NormalizedError = {
  message: string;
  stack?: string;
  publicShape: { name?: string; message: string };
};

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      publicShape: { name: error.name, message: error.message },
    };
  }
  const message = typeof error === "string" ? error : error == null ? "" : String(error);
  return { message, publicShape: { message } };
}

/**
 * Текст ошибки для ответа пользователю.
 * В production стектрейс/детали скрыты — только «Внутренняя ошибка сервера».
 */
export function publicErrorMessage(error?: unknown, fallback = INTERNAL_ERROR_MESSAGE): string {
  if (isProd()) return fallback;
  if (!error) return fallback;
  return normalizeError(error).message || fallback;
}

export const logger = {
  logInfo,
  logWarning,
  logError,
  publicErrorMessage,
  snapshotAndResetCounters,
  peekCounters,
};
