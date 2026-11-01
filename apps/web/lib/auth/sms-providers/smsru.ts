import { fetchWithRetry } from "@/lib/http/fetch-with-retry";

import type { SmsSendResult } from "./types";

/** SMS.ru — работает с номерами РФ (+7). https://sms.ru/api/send */
export function readSmsRuConfig(): { apiId: string; from?: string } | null {
  const apiId = process.env.SMSRU_API_ID?.trim();
  if (!apiId) return null;
  const from = process.env.SMSRU_FROM?.trim();
  return { apiId, from: from || undefined };
}

/** E.164 +79001234567 → 79001234567 для SMS.ru */
export function smsRuPhoneDigits(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return `7${digits.slice(1)}`;
  return digits;
}

/** SMS.ru: мобильные РФ — 11 цифр, код страны 7 + DEF 9xx (79…). */
export function isRuMobileForSmsRu(e164: string): boolean {
  const digits = smsRuPhoneDigits(e164);
  return digits.length === 11 && digits.startsWith("79");
}

type SmsRuSendJson = {
  status?: string;
  status_code?: number;
  balance?: number;
  sms?: Record<
    string,
    { status?: string; status_code?: number; sms_id?: string; status_text?: string }
  >;
};

type SmsRuLimitJson = {
  status?: string;
  status_code?: number;
  total_limit?: number | string;
  used_today?: number | string;
};

export type SmsRuDailyLimit = {
  total: number;
  used: number;
  remaining: number;
};

/** Дневной лимит кабинета (новые аккаунты часто = 10). */
export async function fetchSmsRuDailyLimit(apiId?: string): Promise<SmsRuDailyLimit | null> {
  const id = (apiId ?? process.env.SMSRU_API_ID)?.trim();
  if (!id) return null;
  try {
    const res = await fetchWithRetry(
      `https://sms.ru/my/limit?api_id=${encodeURIComponent(id)}&json=1`,
      { method: "GET" },
      { attempts: 2, timeoutMs: 8_000 },
    );
    const json = (await res.json().catch(() => null)) as SmsRuLimitJson | null;
    if (!json || json.status !== "OK") return null;
    const total = Number(json.total_limit);
    const used = Number(json.used_today ?? 0);
    if (!Number.isFinite(total) || total < 0) return null;
    const usedSafe = Number.isFinite(used) && used > 0 ? used : 0;
    return { total, used: usedSafe, remaining: Math.max(0, total - usedSafe) };
  } catch {
    return null;
  }
}

function buildOtpText(code: string): string {
  // Короткий транслит лучше проходит антиспам операторов, чем «SonoGyn: код».
  return `Kod ${code} SonoGyn. Ne soobshchayte nikomu.`;
}

export async function sendSmsRu(params: {
  toE164: string;
  code: string;
  /** IP пользователя — sms.ru рекомендует для антифрода (колонка «IP пользователя»). */
  clientIp?: string;
}): Promise<SmsSendResult> {
  const cfg = readSmsRuConfig();
  if (!cfg) return { ok: false, errorCode: "sms_not_configured" };

  if (!isRuMobileForSmsRu(params.toE164)) {
    return { ok: false, errorCode: "smsru_non_ru_number" };
  }

  const to = smsRuPhoneDigits(params.toE164);
  if (to.length < 10) return { ok: false, errorCode: "invalid_phone" };

  const limit = await fetchSmsRuDailyLimit(cfg.apiId);
  if (limit && limit.remaining <= 0) {
    return { ok: false, errorCode: "smsru_206" };
  }

  const text = buildOtpText(params.code);
  const body = new URLSearchParams({
    api_id: cfg.apiId,
    to,
    msg: text,
    json: "1",
  });
  // Имя отправителя только если явно задано и согласовано в кабинете —
  // иначе оператор режет доставку (код 204), а дефолт sms.ru доходит чаще.
  if (cfg.from) body.set("from", cfg.from);

  const ip = params.clientIp?.trim();
  // Только публичный IPv4 клиента; не передаём private/link-local.
  if (
    ip &&
    ip !== "unknown" &&
    /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) &&
    !ip.startsWith("10.") &&
    !ip.startsWith("127.") &&
    !ip.startsWith("192.168.") &&
    !/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  ) {
    body.set("ip", ip);
  }

  const attempt = async (paramsBody: URLSearchParams) => {
    let res: Response;
    try {
      // POST надёжнее GET: текст/from не режутся длиной URL.
      res = await fetchWithRetry("https://sms.ru/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: paramsBody.toString(),
      });
    } catch {
      return { ok: false as const, errorCode: "smsru_network_error" };
    }
    const json = (await res.json().catch(() => null)) as SmsRuSendJson | null;

    if (!json || json.status !== "OK") {
      return { ok: false as const, errorCode: `smsru_${json?.status_code ?? res.status}` };
    }

    const first = json.sms ? Object.values(json.sms)[0] : undefined;
    if (!first) {
      return { ok: false as const, errorCode: "smsru_send_failed" };
    }
    if (first.status !== "OK") {
      return { ok: false as const, errorCode: `smsru_${first.status_code ?? "send_failed"}` };
    }
    if (!first.sms_id) {
      return { ok: false as const, errorCode: "smsru_send_failed" };
    }

    return { ok: true as const, providerMessageId: first.sms_id, provider: "smsru" as const };
  };

  const firstTry = await attempt(body);
  // 204: имя отправителя не подключено к оператору — повтор без from.
  if (!firstTry.ok && firstTry.errorCode === "smsru_204" && body.has("from")) {
    body.delete("from");
    return attempt(body);
  }
  return firstTry;
}
