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

export async function sendSmsRu(params: { toE164: string; code: string }): Promise<SmsSendResult> {
  const cfg = readSmsRuConfig();
  if (!cfg) return { ok: false, errorCode: "sms_not_configured" };

  const to = smsRuPhoneDigits(params.toE164);
  if (to.length < 10) return { ok: false, errorCode: "invalid_phone" };

  const text = `SonoGyn Pro: код ${params.code}. Действует 5 мин. Не сообщайте код никому.`;
  const qs = new URLSearchParams({
    api_id: cfg.apiId,
    to,
    msg: text,
    json: "1",
  });
  if (cfg.from) qs.set("from", cfg.from);

  let res: Response;
  try {
    res = await fetchWithRetry(`https://sms.ru/sms/send?${qs.toString()}`, { method: "GET" });
  } catch {
    return { ok: false, errorCode: "smsru_network_error" };
  }
  const json = (await res.json().catch(() => null)) as {
    status?: string;
    status_code?: number;
    sms?: Record<string, { status?: string; status_code?: number; sms_id?: string }>;
  } | null;

  if (!json || json.status !== "OK") {
    return { ok: false, errorCode: `smsru_${json?.status_code ?? res.status}` };
  }

  const first = json.sms ? Object.values(json.sms)[0] : undefined;
  if (first && first.status !== "OK") {
    return { ok: false, errorCode: `smsru_${first.status_code ?? "send_failed"}` };
  }

  return { ok: true, providerMessageId: first?.sms_id, provider: "smsru" };
}
