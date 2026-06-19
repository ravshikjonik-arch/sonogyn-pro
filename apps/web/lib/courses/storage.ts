import type { SupabaseClient } from "@supabase/supabase-js";

export const COURSE_MEDIA_BUCKET = "course-media";

export function courseMediaObjectPath(userId: string, courseId: string, kind: "cover" | "video", fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${courseId}/${kind}/${Date.now()}-${safe}`;
}

export async function uploadCourseCover(
  supabase: SupabaseClient,
  params: { userId: string; courseId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  if (!params.file.type.startsWith("image/")) {
    return { error: "Обложка — только изображение (JPEG, PNG, WebP)." };
  }
  const path = courseMediaObjectPath(params.userId, params.courseId, "cover", params.file.name);
  const { error } = await supabase.storage.from(COURSE_MEDIA_BUCKET).upload(path, params.file, {
    contentType: params.file.type,
    upsert: true,
  });
  if (error) return { error: error.message };
  return { path };
}

export async function uploadCourseLessonVideo(
  supabase: SupabaseClient,
  params: { userId: string; courseId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  if (!params.file.type.startsWith("video/")) {
    return { error: "Загрузите видеофайл MP4 или WebM." };
  }
  const path = courseMediaObjectPath(params.userId, params.courseId, "video", params.file.name);
  const { error } = await supabase.storage.from(COURSE_MEDIA_BUCKET).upload(path, params.file, {
    contentType: params.file.type,
    upsert: false,
  });
  if (error) return { error: error.message };
  return { path };
}

export async function getCourseMediaSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(COURSE_MEDIA_BUCKET).createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
