import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../supabase/mobileClient";

export type EmailAuthResult =
  | {
      ok: true;
      session?: { access_token: string; refresh_token: string };
      needsEmailConfirmation?: boolean;
      needsMfa?: boolean;
      factorId?: string;
    }
  | { ok: false; error: string; requiresCaptcha?: boolean; needsEmailConfirmation?: boolean };

const MOBILE_AUTH_HEADERS = {
  "Content-Type": "application/json",
  "x-sonogyn-client": "mobile",
  "User-Agent": "SonoGynMobile/1.0 (ReactNative)",
} as const;

async function postAuth(body: Record<string, unknown>): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) {
    return { ok: false, error: "API не настроен (EXPO_PUBLIC_API_BASE_URL)." };
  }

  const res = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { ...MOBILE_AUTH_HEADERS },
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
    const apiError = payload?.error ?? "";
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const tryDirectSupabase =
      supabaseMobile &&
      email &&
      password.length >= 6 &&
      (res.status === 401 ||
        res.status === 403 ||
        res.status === 502 ||
        res.status === 503 ||
        /forbidden/i.test(apiError));

    if (tryDirectSupabase && supabaseMobile) {
      const { data, error } = await supabaseMobile.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
        return {
          ok: true,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        };
      }
      if (error && /email not confirmed/i.test(error.message)) {
        return {
          ok: false,
          error: "Email ещё не подтверждён. Откройте ссылку из письма (или войдите на sonogyn-pro.ru).",
          needsEmailConfirmation: true,
        };
      }
    }

    return {
      ok: false,
      error: mapAuthApiError(apiError, res.status, payload?.needsEmailConfirmation),
      requiresCaptcha: payload?.requiresCaptcha,
      needsEmailConfirmation: payload?.needsEmailConfirmation,
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

function pilotLoginHint(): string {
  const open = (process.env.EXPO_PUBLIC_OPEN_ACCESS_FULL ?? "").trim().toLowerCase();
  if (["true", "1", "yes"].includes(open)) {
    return " Вход не обязателен — откройте кабинет без аккаунта.";
  }
  return "";
}

function mapAuthApiError(message: string, status: number, needsEmailConfirmation?: boolean): string {
  if (needsEmailConfirmation || /email not confirmed/i.test(message)) {
    return "Email ещё не подтверждён. Откройте ссылку из письма или войдите на sonogyn-pro.ru.";
  }
  if (status === 403 || /forbidden/i.test(message)) {
    return "Сервер временно отклонил запрос. Обновите приложение или попробуйте через минуту.";
  }
  if (/invalid login credentials|invalid credentials|неверные учётные/i.test(message)) {
    return `Неверный email или пароль.${pilotLoginHint()}`;
  }
  if (/password should be at least/i.test(message)) {
    return "Пароль слишком короткий. Минимум 6 символов.";
  }
  if (/too many|rate/i.test(message) || status === 429) {
    return "Слишком много попыток. Подождите и попробуйте снова.";
  }
  if (message.trim()) return message;
  return "Неверный email или пароль.";
}

export function signInViaApi(email: string, password: string, turnstileToken?: string) {
  return postAuth({ email, password, turnstileToken });
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
  registration?: {
    full_name?: string;
    birth_date?: string;
    birth_year?: number;
    specialization?: string;
    preferred_locale?: string;
    createUser?: boolean;
  },
): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/phone/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({
      phone,
      token,
      createUser: registration?.createUser ?? false,
      full_name: registration?.full_name,
      birth_date: registration?.birth_date,
      birth_year: registration?.birth_year,
      specialization: registration?.specialization,
      preferred_locale: registration?.preferred_locale,
    }),
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

export async function sendTelegramOtpViaApi(
  chatId: string,
  createUser = false,
  turnstileToken?: string,
  fallbackEmail?: string,
): Promise<{ ok: true; message?: string } | { ok: false; error: string; requiresCaptcha?: boolean }> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/send-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sonogyn-client": "mobile",
    },
    body: JSON.stringify({
      method: "telegram",
      contact: chatId,
      purpose: createUser ? "register" : "login",
      turnstileToken,
      fallbackEmail,
    }),
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

export async function verifyTelegramOtpViaApi(
  chatId: string,
  token: string,
  registration?: {
    full_name?: string;
    birth_date?: string;
    birth_year?: number;
    specialization?: string;
    preferred_locale?: string;
    createUser?: boolean;
  },
): Promise<EmailAuthResult> {
  const base = getWebApiBase();
  if (!base) return { ok: false, error: "API не настроен." };

  const res = await fetch(`${base}/api/auth/telegram/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sonogyn-client": "mobile" },
    body: JSON.stringify({
      chatId,
      token,
      createUser: registration?.createUser ?? false,
      full_name: registration?.full_name,
      birth_date: registration?.birth_date,
      birth_year: registration?.birth_year,
      specialization: registration?.specialization,
      preferred_locale: registration?.preferred_locale,
    }),
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
