import type { SupabaseClient } from "@supabase/supabase-js";

export type RegistrationMetadata = {
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
  birth_year?: number;
};

export function parseRegistrationMetadata(body: Record<string, unknown>): RegistrationMetadata {
  const pick = (key: keyof RegistrationMetadata) => {
    const raw = body[key];
    return typeof raw === "string" ? raw.trim() : "";
  };

  const meta: RegistrationMetadata = {};
  const full_name = pick("full_name");
  const preferred_locale = pick("preferred_locale");
  const specialization = pick("specialization");
  const institution = pick("institution");
  const birthYearRaw = body.birth_year;

  if (full_name) meta.full_name = full_name;
  if (preferred_locale) meta.preferred_locale = preferred_locale;
  if (specialization) meta.specialization = specialization;
  if (institution) meta.institution = institution;
  if (typeof birthYearRaw === "number" && Number.isFinite(birthYearRaw)) {
    meta.birth_year = birthYearRaw;
  } else if (typeof birthYearRaw === "string" && /^\d{4}$/.test(birthYearRaw.trim())) {
    meta.birth_year = Number.parseInt(birthYearRaw.trim(), 10);
  }

  return meta;
}

export function registrationMetadataToUserData(
  meta: RegistrationMetadata,
): Record<string, string | number> {
  const data: Record<string, string | number> = {};
  if (meta.full_name) data.full_name = meta.full_name;
  if (meta.preferred_locale) data.preferred_locale = meta.preferred_locale;
  if (meta.specialization) data.specialization = meta.specialization;
  if (meta.institution) data.institution = meta.institution;
  if (meta.birth_year) data.birth_year = meta.birth_year;
  return data;
}

/** E.164; для РФ — строго +7 и 10 цифр после кода страны. */
export function isValidPhoneE164(phone: string): boolean {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return false;
  if (phone.startsWith("+7")) return phone.length === 12;
  return true;
}

export async function applyRegistrationMetadata(
  supabase: SupabaseClient,
  userId: string,
  meta: RegistrationMetadata,
): Promise<void> {
  const userData = registrationMetadataToUserData(meta);
  if (Object.keys(userData).length > 0) {
    await supabase.auth.updateUser({ data: userData });
  }

  await syncProfileFromRegistration(supabase, userId, meta);
}

/** Service role — до/без клиентской сессии (SMS-вход). */
export async function applyRegistrationMetadataAdmin(
  admin: SupabaseClient,
  userId: string,
  meta: RegistrationMetadata,
  extraMetadata?: Record<string, string | number>,
): Promise<void> {
  const userData = registrationMetadataToUserData(meta);
  const merged = { ...userData, ...extraMetadata };
  if (Object.keys(merged).length > 0) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: merged });
  }

  await syncProfileFromRegistration(admin, userId, meta);
}

async function syncProfileFromRegistration(
  supabase: SupabaseClient,
  userId: string,
  meta: RegistrationMetadata,
): Promise<void> {
  const profilePatch: Record<string, string | number> = {};
  if (meta.full_name) profilePatch.full_name = meta.full_name;
  if (meta.specialization) profilePatch.specialization = meta.specialization;
  if (meta.institution) profilePatch.institution = meta.institution;
  if (meta.birth_year) profilePatch.birth_year = meta.birth_year;

  if (Object.keys(profilePatch).length === 0) return;

  await supabase
    .from("profiles")
    .update({ ...profilePatch, updated_at: new Date().toISOString() })
    .eq("id", userId);
}
