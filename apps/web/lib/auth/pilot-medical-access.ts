import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const CHAT_READY_STATUSES = new Set(["resident", "doctor", "verified_doctor"]);

export function isProfileReadyForPilotChat(input: {
  full_name?: string | null;
  specialization?: string | null;
  birth_year?: number | null;
}): boolean {
  return Boolean(input.full_name?.trim() && input.specialization?.trim() && input.birth_year);
}

/** Email-only pilot: после заполнения профиля открываем чат врачей без ручной модерации. */
export async function autoGrantPilotMedicalAccess(userId: string): Promise<boolean> {
  if (!isAuthEmailOnly()) return false;

  const admin = createServiceRoleClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name, specialization, birth_year, medical_access_status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || !isProfileReadyForPilotChat(profile)) return false;
  if (CHAT_READY_STATUSES.has(profile.medical_access_status ?? "")) return true;

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      medical_access_status: "doctor",
      medical_verified_at: new Date().toISOString(),
      medical_verification_note: "Pilot · auto on profile complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !updateError;
}
