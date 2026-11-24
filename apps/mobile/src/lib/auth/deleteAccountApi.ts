import { getWebApiBase } from "../../api/chatBackend";

export async function deleteAccount(
  accessToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = getWebApiBase();
  if (!base) {
    return { ok: false, error: "API не настроен (EXPO_PUBLIC_API_BASE_URL)." };
  }

  const res = await fetch(`${base}/api/profile/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "x-sonogyn-client": "mobile",
    },
    body: JSON.stringify({ confirm: "DELETE" }),
  });

  const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !payload?.ok) {
    return { ok: false, error: payload?.error ?? `HTTP ${res.status}` };
  }

  return { ok: true };
}