import { createClient } from "@supabase/supabase-js";

export type DevLoginConfig = {
  email: string;
  password: string;
  full_name: string;
  specialization: string;
  institution: string;
};

export function isDevAutoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN === "true";
}

/** Локально открыть кабинет без Supabase-регистрации (только dev). */
export function isDevSkipAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true";
}

export function getDevBypassProfile(): Pick<DevLoginConfig, "email" | "full_name" | "specialization" | "institution"> | null {
  if (!isDevSkipAuthEnabled()) return null;
  return getDevLoginConfig();
}

export function getDevLoginConfig(): DevLoginConfig | null {
  const email = process.env.DEV_LOGIN_EMAIL?.trim();
  const password = process.env.DEV_LOGIN_PASSWORD;
  const full_name = process.env.DEV_LOGIN_FULL_NAME?.trim();

  if (!email || !password || !full_name) return null;

  return {
    email,
    password,
    full_name,
    specialization: process.env.DEV_LOGIN_SPECIALIZATION?.trim() || "Врач УЗИ",
    institution: process.env.DEV_LOGIN_INSTITUTION?.trim() || "",
  };
}

function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

type AdminAuthClient = {
  auth: {
    admin: {
      listUsers: (params: { page: number; perPage: number }) => Promise<{
        data: { users: { id: string; email?: string | null }[] };
        error: { message: string } | null;
      }>;
    };
  };
};

async function findUserIdByEmail(admin: AdminAuthClient, email: string): Promise<string | null> {
  const target = email.toLowerCase();

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found) return found.id;

    if (data.users.length < 200) break;
  }

  return null;
}

/** Создаёт или обновляет dev-пользователя через service role (обходит «signups disabled»). */
export async function ensureDevUserExists(config: DevLoginConfig): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();

  if (!url || !serviceKey) {
    return {
      ok: false,
      message:
        "Добавьте SUPABASE_SERVICE_ROLE_KEY в apps/web/.env.local (Supabase → Settings → API → service_role) и перезапустите dev.",
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const metadata = {
    full_name: config.full_name,
    specialization: config.specialization,
    ...(config.institution ? { institution: config.institution } : {}),
  };

  try {
    const existingId = await findUserIdByEmail(admin, config.email);

    if (existingId) {
      const { error } = await admin.auth.admin.updateUserById(existingId, {
        password: config.password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    }

    const { error } = await admin.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

type SupabaseAuthClient = {
  auth: {
    verifyOtp: (params: { type: "signup" | "magiclink" | "recovery"; token_hash: string }) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

/** Admin generateLink + verifyOtp — работает, когда email-логин отключён в Dashboard. */
export async function signInDevUserViaAdminLink(
  supabase: SupabaseAuthClient,
  config: DevLoginConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();

  if (!url || !serviceKey) {
    return {
      ok: false,
      message:
        "Нужен SUPABASE_SERVICE_ROLE_KEY в apps/web/.env.local (Supabase → Settings → API → service_role).",
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const metadata = {
    full_name: config.full_name,
    specialization: config.specialization,
    ...(config.institution ? { institution: config.institution } : {}),
  };

  let link = await admin.auth.admin.generateLink({
    type: "signup",
    email: config.email,
    password: config.password,
    options: { data: metadata },
  });

  if (link.error) {
    await ensureDevUserExists(config);
    link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: config.email,
    });
  }

  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    return { ok: false, message: link.error?.message ?? "Не удалось получить dev-токен входа" };
  }

  const otpType =
    link.data.properties.verification_type === "signup"
      ? "signup"
      : link.data.properties.verification_type === "recovery"
        ? "recovery"
        : "magiclink";

  const { error } = await supabase.auth.verifyOtp({
    type: otpType,
    token_hash: tokenHash,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
