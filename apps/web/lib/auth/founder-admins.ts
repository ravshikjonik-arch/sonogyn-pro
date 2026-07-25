import { createServiceRoleClient } from "@/utils/supabase/admin";

/**
 * Основатель SonoGyn — роль admin + verified_doctor закрепляются service-role
 * при обращении к профилю (нельзя «потерять» доступ из UI).
 */
export const FOUNDER_ADMIN_USER_IDS = new Set<string>([
  "55d7a4c9-3dbb-4627-b0f6-a0a1efe01993",
  "d1fb4c18-9cef-4973-b8a4-399f2e8fde59",
  "c044b9a2-0569-4190-805d-f37dc0e15b6e",
  "0458c08a-8e99-46fd-aef9-8f774cc6b58f",
  "d7faa394-0c59-436a-93df-615758687166",
]);

export const FOUNDER_ADMIN_FULL_NAMES = new Set<string>(["Якубов Равшан Вахобжонович"]);

export function isFounderAdminCandidate(input: {
  userId: string;
  fullName?: string | null;
}): boolean {
  if (FOUNDER_ADMIN_USER_IDS.has(input.userId)) return true;
  const name = input.fullName?.trim();
  return Boolean(name && FOUNDER_ADMIN_FULL_NAMES.has(name));
}

/** Идемпотентно поднимает founder-аккаунт до admin + verified_doctor. */
export async function ensureFounderAdminAccess(userId: string): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, role, full_name, medical_access_status")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) return false;
    if (!isFounderAdminCandidate({ userId, fullName: profile.full_name })) return false;

    const needsRole = profile.role !== "admin";
    const needsAccess = profile.medical_access_status !== "verified_doctor";
    if (!needsRole && !needsAccess) return true;

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: "admin",
        medical_access_status: "verified_doctor",
        medical_verified_at: new Date().toISOString(),
        medical_verification_note: "Founder admin — permanent grant",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return !updateError;
  } catch {
    return false;
  }
}
