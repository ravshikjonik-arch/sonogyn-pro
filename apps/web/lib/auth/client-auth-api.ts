export type AuthApiResult =
  | { ok: true; needsEmailConfirmation?: boolean; needsMfa?: boolean; factorId?: string; message?: string }
  | { ok: false; error: string; requiresCaptcha?: boolean; needsEmailConfirmation?: boolean };

export async function postSignIn(params: {
  email: string;
  password: string;
  turnstileToken?: string;
  mobile?: boolean;
}): Promise<AuthApiResult & { session?: { access_token: string; refresh_token: string } }> {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.mobile ? { "x-sonogyn-client": "mobile" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      turnstileToken: params.turnstileToken,
    }),
  });
  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    needsMfa?: boolean;
    needsEmailConfirmation?: boolean;
    factorId?: string;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Неверные учётные данные.",
      requiresCaptcha: payload?.requiresCaptcha,
      needsEmailConfirmation: payload?.needsEmailConfirmation,
    };
  }

  return {
    ok: true,
    needsMfa: payload.needsMfa,
    factorId: payload.factorId,
    session: payload.session,
  };
}

export async function postMfaVerifyLogin(params: {
  factorId: string;
  code: string;
  mobile?: boolean;
}): Promise<AuthApiResult & { session?: { access_token: string; refresh_token: string } }> {
  const res = await fetch("/api/auth/mfa/verify-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.mobile ? { "x-sonogyn-client": "mobile" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify({ factorId: params.factorId, code: params.code }),
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

export async function postSignUp(params: {
  email: string;
  password: string;
  full_name: string;
  specialization?: string;
  institution?: string;
  preferred_locale?: string;
  turnstileToken?: string;
  mobile?: boolean;
}): Promise<AuthApiResult & { session?: { access_token: string; refresh_token: string } }> {
  const res = await fetch("/api/auth/sign-up", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.mobile ? { "x-sonogyn-client": "mobile" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify(params),
  });
  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    needsEmailConfirmation?: boolean;
    message?: string;
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Не удалось завершить регистрацию.",
      requiresCaptcha: payload?.requiresCaptcha,
    };
  }
  return {
    ok: true,
    needsEmailConfirmation: payload.needsEmailConfirmation,
    message: payload.message,
    session: payload.session,
  };
}

export async function postResendConfirmation(params: {
  email: string;
  turnstileToken?: string;
}): Promise<{ ok: true; message?: string } | { ok: false; error: string; requiresCaptcha?: boolean }> {
  const res = await fetch("/api/auth/resend-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(params),
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
      error: payload?.error ?? "Не удалось отправить письмо.",
      requiresCaptcha: payload?.requiresCaptcha,
    };
  }
  return { ok: true, message: payload.message };
}

export async function postPhoneSendOtp(params: {
  phone: string;
  createUser?: boolean;
  turnstileToken?: string;
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
  mobile?: boolean;
}): Promise<{ ok: true; message?: string } | { ok: false; error: string; requiresCaptcha?: boolean }> {
  const res = await fetch("/api/auth/phone/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.mobile ? { "x-sonogyn-client": "mobile" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify(params),
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

export async function postPhoneVerifyOtp(params: {
  phone: string;
  token: string;
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
  mobile?: boolean;
}): Promise<AuthApiResult & { session?: { access_token: string; refresh_token: string } }> {
  const res = await fetch("/api/auth/phone/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.mobile ? { "x-sonogyn-client": "mobile" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify({
      phone: params.phone,
      token: params.token,
      full_name: params.full_name,
      preferred_locale: params.preferred_locale,
      specialization: params.specialization,
      institution: params.institution,
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

export async function fetchAuthSession(): Promise<{ user: Record<string, unknown> | null }> {
  const res = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as { user?: Record<string, unknown> | null } | null;
  return { user: payload?.user ?? null };
}
