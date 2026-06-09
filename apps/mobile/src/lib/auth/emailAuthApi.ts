import { getWebApiBase } from "../../api/chatBackend";

export type EmailAuthResult =
  | {
      ok: true;
      session?: { access_token: string; refresh_token: string };
      needsEmailConfirmation?: boolean;
      needsMfa?: boolean;
      factorId?: string;
    }
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
    needsMfa?: boolean;
    factorId?: string;
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
    needsMfa: payload.needsMfa,
    factorId: payload.factorId,
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

export async function verifyMfaViaApi(
  factorId: string,
  code: string,
  session?: { access_token: string; refresh_token: string },
): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/mfa/verify-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sonogyn-client": "mobile",
    },
    body: JSON.stringify({ factorId, code, session }),
  });

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return { ok: false, error: payload?.error ?? "Неверный или просроченный код." };
  }
  return { ok: true, session: payload.session };
}

export async function exchangeMobileSessionCode(
  exchangeCode: string,
): Promise<{ ok: true; session: { access_token: string; refresh_token: string } } | { ok: false; error: string }> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/mobile/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({ exchangeCode }),
  });

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok || !payload.session) {
    return { ok: false, error: payload?.error ?? "Код обмена недействителен." };
  }
  return { ok: true, session: payload.session };
}

export async function sendPhoneOtpViaApi(
  phone: string,
  createUser = false,
  turnstileToken?: string,
): Promise<{ ok: true; message?: string } | { ok: false; error: string; requiresCaptcha?: boolean }> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/phone/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({ phone, createUser, turnstileToken }),
  });

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    message?: string;
    requiresCaptcha?: boolean;
  } | null;

  if (!res.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Не удалось отправить код.",
      requiresCaptcha: payload?.requiresCaptcha,
    };
  }
  return { ok: true, message: payload.message };
}

export async function verifyPhoneOtpViaApi(
  phone: string,
  token: string,
): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/phone/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({ phone, token }),
  });

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return { ok: false, error: payload?.error ?? "Неверный или просроченный код." };
  }
  return { ok: true, session: payload.session };
}
