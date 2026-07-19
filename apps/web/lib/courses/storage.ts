import type { SupabaseClient } from "@supabase/supabase-js";

import {
  detectClinicalImageKind,
  extensionForClinicalKind,
  validateClinicalImageBuffer,
} from "@repo/upload-validation";

export const COURSE_MEDIA_BUCKET = "course-media";

export function courseMediaObjectPath(userId: string, courseId: string, kind: "cover" | "video", fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${courseId}/${kind}/${Date.now()}-${safe}`;
}

export async function uploadCourseCover(
  supabase: SupabaseClient,
  params: { userId: string; courseId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  const buf = new Uint8Array(await params.file.arrayBuffer());
  const check = validateClinicalImageBuffer(buf, 5 * 1024 * 1024);
  if (!check.ok) return { error: check.error };

  const kind = detectClinicalImageKind(buf);
  if (!kind) return { error: "Обложка — только изображение (JPEG, PNG, WebP, GIF)." };

  const ext = extensionForClinicalKind(kind);
  const path = courseMediaObjectPath(params.userId, params.courseId, "cover", `cover.${ext}`);
  const contentType =
    kind === "png" ? "image/png" : kind === "webp" ? "image/webp" : kind === "gif" ? "image/gif" : "image/jpeg";

  const { error } = await supabase.storage.from(COURSE_MEDIA_BUCKET).upload(path, buf, {
    contentType,
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
