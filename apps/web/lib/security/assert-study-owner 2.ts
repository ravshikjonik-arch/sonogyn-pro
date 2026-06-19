import type { SupabaseClient } from "@supabase/supabase-js";

/** Defense-in-depth: verify study belongs to user before RLS-only routes. */
export async function assertStudyOwnedByUser(
  supabase: SupabaseClient,
  studyId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .eq("created_by", userId)
    .maybeSingle();

  return !error && !!data;
}

/** Defense-in-depth: verify patient chart belongs to current clinician. */
export async function assertPatientOwnedByUser(
  supabase: SupabaseClient,
  patientId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("created_by", userId)
    .maybeSingle();

  return !error && !!data;
}
