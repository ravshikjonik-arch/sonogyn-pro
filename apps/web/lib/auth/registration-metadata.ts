import type { SupabaseClient } from "@supabase/supabase-js";

export type RegistrationMetadata = {
  full_name?: string;
  preferred_locale?: string;
  specialization?: string;
  institution?: string;
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

  if (full_name) meta.full_name = full_name;
  if (preferred_locale) meta.preferred_locale = preferred_locale;
  if (specialization) meta.specialization = specialization;
  if (institution) meta.institution = institution;

  return meta;
}

export function registrationMetadataToUserData(
  meta: RegistrationMetadata,
): Record<string, string> {
  const data: Record<string, string> = {};
  if (meta.full_name) data.full_name = meta.full_name;
  if (meta.preferred_locale) data.preferred_locale = meta.preferred_locale;
  if (meta.specialization) data.specialization = meta.specialization;
  if (meta.institution) data.institution = meta.institution;
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

  const profilePatch: Record<string, string> = {};
  if (meta.full_name) profilePatch.full_name = meta.full_name;
  if (meta.specialization) profilePatch.specialization = meta.specialization;
  if (meta.institution) profilePatch.institution = meta.institution;

  if (Object.keys(profilePatch).length === 0) return;

  await supabase
    .from("profiles")
    .update({ ...profilePatch, updated_at: new Date().toISOString() })
    .eq("id", userId);
}
