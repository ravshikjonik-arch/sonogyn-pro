export type AuthApiResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string; requiresCaptcha?: boolean };

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
    session?: { access_token: string; refresh_token: string };
  } | null;

  if (!res.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Неверные учётные данные.",
      requiresCaptcha: payload?.requiresCaptcha,
    };
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
    session: payload.session,
  };
}
