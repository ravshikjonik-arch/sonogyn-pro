import { fetchWithRetry } from "@/lib/http/retry";

import { mapSmsRuErrorCode } from "./errors";

type SmsRuResult = { ok: true } | { ok: false; errorCode: string; message: string };

/** Отправка SMS через sms.ru HTTP API (GET + json=1). */
export async function sendSmsRu(phone: string, text: string): Promise<SmsRuResult> {
  const apiId = process.env.SMSRU_API_ID?.trim();
  if (!apiId) {
    return {
      ok: false,
      errorCode: "smsru_not_configured",
      message: "SMS не настроен: задайте SMSRU_API_ID в переменных окружения.",
    };
  }

  const from = process.env.SMSRU_FROM?.trim();
  const params = new URLSearchParams({
    api_id: apiId,
    to: phone.replace(/\D/g, ""),
    msg: text,
    json: "1",
  });
  if (from) params.set("from", from);

  let res: Response;
  try {
    res = await fetchWithRetry(`https://sms.ru/sms/send?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      errorCode: "smsru_network_error",
      message: "Нет связи с sms.ru. Проверьте интернет или попробуйте позже.",
    };
  }

  const json = (await res.json().catch(() => null)) as {
    status?: string;
    status_code?: number;
    sms?: Record<string, { status?: string; status_code?: number }>;
  } | null;

  if (json?.status === "OK" || json?.status_code === 100) {
    const first = json.sms ? Object.values(json.sms)[0] : undefined;
    if (first && first.status !== "OK" && first.status_code !== 100) {
      return {
        ok: false,
        errorCode: `smsru_${first.status_code ?? "send_failed"}`,
        message: mapSmsRuErrorCode(first.status_code, res.status),
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    errorCode: `smsru_${json?.status_code ?? res.status}`,
    message: mapSmsRuErrorCode(json?.status_code, res.status),
  };
}
