import { fetchWithRetry } from "@/lib/http/retry";

type SmscResult = { ok: true } | { ok: false; errorCode: string };

/** Запасной провайдер smsc.ru. */
export async function sendSmsc(phone: string, text: string): Promise<SmscResult> {
  const login = process.env.SMSC_LOGIN?.trim();
  const password = process.env.SMSC_PASSWORD?.trim();
  if (!login || !password) return { ok: false, errorCode: "smsc_not_configured" };

  const params = new URLSearchParams({
    login,
    psw: password,
    phones: phone.replace(/\D/g, ""),
    mes: text,
    fmt: "3",
  });

  const res = await fetchWithRetry(`https://smsc.ru/sys/send.php?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = (await res.json()) as { error?: string; id?: number };
  if (json.id && !json.error) return { ok: true };
  return { ok: false, errorCode: json.error ?? `smsc_${res.status}` };
}
