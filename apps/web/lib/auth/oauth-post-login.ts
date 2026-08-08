import type { SupabaseClient, User } from "@supabase/supabase-js";

import { safeInternalPath } from "@/lib/nav/safe-redirect";

const OPEN_HOME = "/home";
const PROFILE_PATH = "/profile";

/** Имя из user_metadata Яндекс / других IdP. */
export function extractOAuthDisplayName(user: User): string | null {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>;

  const asString = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const direct =
    asString(m.full_name) ||
    asString(m.fullName) ||
    asString(m.name) ||
    asString(m.display_name) ||
    asString(m.preferred_username);
  if (direct) return direct;

  const family = asString(m.family_name) || asString(m.last_name);
  const given = asString(m.given_name) || asString(m.first_name);
  const middle = asString(m.middle_name) || asString(m.patronymic);
  const parts = [family, given, middle].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");

  return null;
}

export function isClinicalProfileReady(input: {
  full_name?: string | null;
  specialization?: string | null;
}): boolean {
  return Boolean(input.full_name?.trim() && input.specialization?.trim());
}

/**
 * После OAuth: подставить ФИО из IdP, если пусто;
 * готовый профиль → requestedNext (/home), иначе → /profile.
 */
export async function finalizeOAuthLogin(
  supabase: SupabaseClient,
  user: User,
  requestedNext: string,
): Promise<string> {
  const oauthName = extractOAuthDisplayName(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, specialization")
    .eq("id", user.id)
    .maybeSingle();

  let fullName = profile?.full_name?.trim() ?? "";
  const specialization = profile?.specialization?.trim() ?? "";

  if (!fullName && oauthName) {
    const patch = {
      full_name: oauthName,
      updated_at: new Date().toISOString(),
    };
    if (profile) {
      await supabase.from("profiles").update(patch).eq("id", user.id);
    } else {
      await supabase.from("profiles").upsert({ id: user.id, ...patch });
    }
    fullName = oauthName;

    const meta = { ...(user.user_metadata ?? {}) };
    if (!meta.full_name) {
      await supabase.auth.updateUser({ data: { ...meta, full_name: oauthName } });
    }
  }

  if (!isClinicalProfileReady({ full_name: fullName, specialization })) {
    return PROFILE_PATH;
  }

  let next = safeInternalPath(requestedNext, OPEN_HOME);
  if (next === "/app" || next.startsWith("/app?")) next = OPEN_HOME;
  if (next === "/login" || next === "/register" || next.startsWith("/login?") || next.startsWith("/register?")) {
    return OPEN_HOME;
  }
  return next;
}
