import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { resolveUserIdByEmail } from "@/lib/auth/resolve-user-by-email";

export type DevLoginConfig = {
  email: string;
  password: string;
  full_name: string;
  specialization: string;
  institution: string;
  birth_year: number;
};

function parseBirthYear(): number | null {
  const raw = process.env.DEV_LOGIN_BIRTH_YEAR?.trim();
  if (!raw || !/^\d{4}$/.test(raw)) return null;
  const year = Number.parseInt(raw, 10);
  if (year < 1900 || year > 2100) return null;
  return year;
}

export function isDevAutoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN === "true";
}

/** Локально открыть кабинет без Supabase-регистрации (только dev). */
export function isDevSkipAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true";
}

/** Product mode: temporarily open the doctor-facing platform without registration. */
export function isFullOpenAccessEnabled(): boolean {
  const raw = (
    process.env.NEXT_PUBLIC_OPEN_ACCESS_FULL ??
    process.env.OPEN_ACCESS_FULL ??
    "true"
  )
    .trim()
    .toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}

export function getOpenAccessProfile(): Pick<
  DevLoginConfig,
  "email" | "full_name" | "specialization" | "institution" | "birth_year"
> | null {
  if (!isFullOpenAccessEnabled()) return null;
  return {
    email: "open-access@sonogyn.pro",
    full_name: "Открытый доступ",
    specialization: "Акушер-гинеколог / врач УЗД",
    institution: "SonoGyn Pro",
    birth_year: 1988,
  };
}

export function hasDevServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** Автредирект на /api/auth/dev-login только если есть service role (иначе белый JSON-экран). */
export function canDevAutoLoginRedirect(): boolean {
  return isDevAutoLoginEnabled() && Boolean(getDevLoginConfig()) && hasDevServiceRoleKey();
}

export function getDevBypassProfile(): Pick<
  DevLoginConfig,
  "email" | "full_name" | "specialization" | "institution" | "birth_year"
> | null {
  if (isFullOpenAccessEnabled()) return getOpenAccessProfile();
  if (!isDevSkipAuthEnabled()) return null;
  return getDevLoginConfig();
}

export function getDevLoginConfig(): DevLoginConfig | null {
  const email = process.env.DEV_LOGIN_EMAIL?.trim();
  const password = process.env.DEV_LOGIN_PASSWORD;
  const full_name = process.env.DEV_LOGIN_FULL_NAME?.trim();
  const birth_year = parseBirthYear();

  if (!email || !password || !full_name || birth_year === null) return null;

  return {
    email,
    password,
    full_name,
    birth_year,
    specialization: process.env.DEV_LOGIN_SPECIALIZATION?.trim() || "Акушер-гинеколог",
    institution: process.env.DEV_LOGIN_INSTITUTION?.trim() || "",
  };
}

function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

function buildUserMetadata(config: DevLoginConfig): Record<string, string | number> {
  return {
    full_name: config.full_name,
    specialization: config.specialization,
    birth_year: config.birth_year,
    ...(config.institution ? { institution: config.institution } : {}),
  };
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
  const fromIndex = await resolveUserIdByEmail(email);
  if (fromIndex) return fromIndex;

  const target = email.toLowerCase();

  // Fallback: paginated scan (slow — only when user_metadata index is missing).
  for (let page = 1; page <= 3; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found) return found.id;

    if (data.users.length < 200) break;
  }

  return null;
}

/** Синхронизирует profiles + users после dev-login (service role). */
export async function syncDevDoctorProfile(
  admin: SupabaseClient,
  userId: string,
  config: DevLoginConfig,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const row = {
    full_name: config.full_name,
    specialization: config.specialization,
    institution: config.institution || null,
    birth_year: config.birth_year,
    updated_at: nowIso,
  };

  await admin.from("profiles").update(row).eq("id", userId);
  await admin.from("users").upsert(
    {
      id: userId,
      email: config.email,
      ...row,
    },
    { onConflict: "id" },
  );
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

  const metadata = buildUserMetadata(config);

  try {
    const existingId = await findUserIdByEmail(admin, config.email);

    if (existingId) {
      const { error } = await admin.auth.admin.updateUserById(existingId, {
        password: config.password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) return { ok: false, message: error.message };
      await syncDevDoctorProfile(admin, existingId, config);
      return { ok: true };
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) return { ok: false, message: error.message };
    if (data.user?.id) await syncDevDoctorProfile(admin, data.user.id, config);
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

  const metadata = buildUserMetadata(config);

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
