import { getWebApiBase } from "../../api/chatBackend";

export type EmailAuthResult =
  | { ok: true; session?: { access_token: string; refresh_token: string }; needsEmailConfirmation?: boolean }
  | { ok: false; error: string; requiresCaptcha?: boolean };

async function postAuth(
  path: "sign-in" | "sign-up",
  body: Record<string, unknown>,
): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) {
    return { ok: false, error: "API не настроен (EXPO_PUBLIC_API_BASE_URL)." };
  }

  const res = await fetch(`${base}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sonogyn-client": "mobile",
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    needsEmailConfirmation?: boolean;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Неверные учётные данные.",
      requiresCaptcha: payload?.requiresCaptcha,
    };
  }

  return {
    ok: true,
    session: payload.session,
    needsEmailConfirmation: payload.needsEmailConfirmation,
  };
}

export function signInViaApi(email: string, password: string, turnstileToken?: string) {
  return postAuth("sign-in", { email, password, turnstileToken });
}

export function signUpViaApi(
  email: string,
  password: string,
  full_name: string,
  extra?: { preferred_locale?: string; turnstileToken?: string },
) {
  return postAuth("sign-up", { email, password, full_name, ...extra });
}
