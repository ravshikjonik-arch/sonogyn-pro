import { fetchWithRetry } from "@/lib/http/retry";

type SmsRuResult = { ok: true } | { ok: false; errorCode: string };

/** Отправка SMS через sms.ru HTTP API. */
export async function sendSmsRu(phone: string, text: string): Promise<SmsRuResult> {
  const apiId = process.env.SMSRU_API_ID?.trim();
  if (!apiId) return { ok: false, errorCode: "smsru_not_configured" };

  const from = process.env.SMSRU_FROM?.trim();
  const params = new URLSearchParams({
    api_id: apiId,
    to: phone.replace(/\D/g, ""),
    msg: text,
    json: "1",
  });
  if (from) params.set("from", from);

  const res = await fetchWithRetry(`https://sms.ru/sms/send?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = (await res.json()) as { status?: string; status_code?: number };
  if (json.status === "OK" || json.status_code === 100) return { ok: true };
  return { ok: false, errorCode: `smsru_${json.status_code ?? res.status}` };
}
