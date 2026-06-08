import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCTOR_CHAT_MEDIA_BUCKET = "doctor-chat-media";

export type ChatMediaType = "image" | "video";

export function chatMediaTypeFromFile(file: File): ChatMediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function chatMediaObjectPath(
  userId: string,
  scope: "channel" | "case-comment",
  scopeId: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = scope === "channel" ? "channels" : "case-comments";
  return `${userId}/${folder}/${scopeId}/${Date.now()}-${safe}`;
}

export async function uploadChatMedia(
  supabase: SupabaseClient,
  params: {
    userId: string;
    scope: "channel" | "case-comment";
    scopeId: string;
    file: File;
  },
): Promise<{ storagePath: string; mediaType: ChatMediaType } | { error: string }> {
  const mediaType = chatMediaTypeFromFile(params.file);
  if (!mediaType) return { error: "Нужен файл изображения или видео" };

  const storagePath = chatMediaObjectPath(
    params.userId,
    params.scope,
    params.scopeId,
    params.file.name,
  );

  const { error } = await supabase.storage.from(DOCTOR_CHAT_MEDIA_BUCKET).upload(storagePath, params.file, {
    contentType: params.file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) return { error: error.message };
  return { storagePath, mediaType };
}

export async function getChatMediaSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DOCTOR_CHAT_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
