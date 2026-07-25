import { fetchWithRetry } from "@/lib/http/fetch-with-retry";
import { readSmsRuConfig, smsRuPhoneDigits } from "@/lib/auth/sms-providers/smsru";

export type SmsTextResult = { ok: true; providerMessageId?: string } | { ok: false; errorCode: string };

/** Произвольный SMS-текст через SMS.ru (не OTP). */
export async function sendSmsRuText(params: { toE164: string; text: string }): Promise<SmsTextResult> {
  const cfg = readSmsRuConfig();
  if (!cfg) return { ok: false, errorCode: "sms_not_configured" };

  const to = smsRuPhoneDigits(params.toE164);
  if (to.length < 10) return { ok: false, errorCode: "invalid_phone" };

  const msg = params.text.slice(0, 800);
  const qs = new URLSearchParams({ api_id: cfg.apiId, to, msg, json: "1" });
  if (cfg.from) qs.set("from", cfg.from);

  const attempt = async (paramsQs: URLSearchParams): Promise<SmsTextResult> => {
    let res: Response;
    try {
      res = await fetchWithRetry(`https://sms.ru/sms/send?${paramsQs.toString()}`, { method: "GET" });
    } catch {
      return { ok: false, errorCode: "smsru_network_error" };
    }

    const json = (await res.json().catch(() => null)) as {
      status?: string;
      status_code?: number;
      sms?: Record<string, { status?: string; status_code?: number; sms_id?: string }>;
    } | null;

    if (!json || json.status !== "OK") {
      return { ok: false, errorCode: `smsru_${json?.status_code ?? "send_failed"}` };
    }

    const first = json.sms ? Object.values(json.sms)[0] : undefined;
    if (first && first.status !== "OK") {
      return { ok: false, errorCode: `smsru_${first.status_code ?? "send_failed"}` };
    }

    return { ok: true, providerMessageId: first?.sms_id };
  };

  const firstTry = await attempt(qs);
  if (!firstTry.ok && firstTry.errorCode === "smsru_204" && qs.has("from")) {
    qs.delete("from");
    return attempt(qs);
  }
  return firstTry;
}
