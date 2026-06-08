import type { SupabaseClient } from "@supabase/supabase-js";

export const TEACHING_CASE_MEDIA_BUCKET = "teaching-case-media";

export type CaseMediaRow = {
  id: string;
  case_id: string;
  storage_path: string;
  media_type: "image" | "video" | "dicom";
  order_index: number;
  uploaded_at: string;
};

export function caseMediaObjectPath(userId: string, caseId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${caseId}/${Date.now()}-${safe}`;
}

export function mediaTypeFromFile(file: File): "image" | "video" | "dicom" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.name.toLowerCase().endsWith(".dcm")) return "dicom";
  return null;
}

export async function uploadCaseMedia(
  supabase: SupabaseClient,
  params: { userId: string; caseId: string; file: File },
): Promise<{ row: CaseMediaRow } | { error: string }> {
  const mediaType = mediaTypeFromFile(params.file);
  if (!mediaType) return { error: "Нужен файл изображения или видео" };

  const storagePath = caseMediaObjectPath(params.userId, params.caseId, params.file.name);
  const { error: uploadErr } = await supabase.storage
    .from(TEACHING_CASE_MEDIA_BUCKET)
    .upload(storagePath, params.file, {
      contentType: params.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadErr) return { error: uploadErr.message };

  const { data: rows, error: insertErr } = await supabase
    .from("case_media")
    .insert({
      case_id: params.caseId,
      storage_path: storagePath,
      media_type: mediaType,
    })
    .select("id,case_id,storage_path,media_type,order_index,uploaded_at")
    .single();

  if (insertErr || !rows) {
    await supabase.storage.from(TEACHING_CASE_MEDIA_BUCKET).remove([storagePath]);
    return { error: insertErr?.message ?? "Не удалось сохранить запись media" };
  }

  return { row: rows as CaseMediaRow };
}

export async function getCaseMediaSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(TEACHING_CASE_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
