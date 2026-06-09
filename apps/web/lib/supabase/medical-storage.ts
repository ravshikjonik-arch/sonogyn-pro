import type { SupabaseClient } from "@supabase/supabase-js";

import { validateAvatarUpload } from "@/lib/security/file-validation";

/** Private bucket; paths must be `{userId}/…` per RLS policies. */
export const CLINICAL_AVATARS_BUCKET = "clinical-avatars";

export function clinicalAvatarObjectPath(userId: string, fileName = "avatar"): string {
  return `${userId}/${fileName}`;
}

export async function uploadClinicalAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const sig = await validateAvatarUpload(file);
  if (!sig.ok) return { error: sig.error };

  const path = clinicalAvatarObjectPath(userId);
  const { error } = await supabase.storage.from(CLINICAL_AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) {
    return { error: error.message };
  }
  return { path };
}
