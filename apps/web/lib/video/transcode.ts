import { fetchWithRetry } from "@/lib/http/fetch-with-retry";
import { getBucket } from "@/lib/storage/s3";
import { lessonHlsPlaylistKey, lessonHlsPrefix, lessonSourceVideoKey } from "@/lib/storage/config";

export type TranscodeResult =
  | { ok: true; mode: "webhook" | "local" | "mp4_fallback" }
  | { ok: false; error: string };

/** Запуск HLS-транскодинга (webhook или локальный ffmpeg для dev). */
export async function triggerLessonVideoTranscode(params: {
  courseId: string;
  lessonId: string;
  sourceKey: string;
  mimeType: string;
}): Promise<TranscodeResult> {
  const webhook = process.env.VIDEO_TRANSCODE_WEBHOOK_URL?.trim();
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const hlsKey = lessonHlsPlaylistKey(params.courseId, params.lessonId);

  if (webhook) {
    try {
      await fetchWithRetry(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: params.courseId,
          lessonId: params.lessonId,
          bucket: getBucket(),
          sourceKey: params.sourceKey,
          hlsPrefix: lessonHlsPrefix(params.courseId, params.lessonId),
          hlsPlaylistKey: hlsKey,
          callbackUrl: `${appOrigin}/api/webhooks/video/hls-complete`,
          callbackSecret: process.env.VIDEO_TRANSCODE_WEBHOOK_SECRET?.trim() || undefined,
        }),
      });
      return { ok: true, mode: "webhook" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Webhook transcode failed" };
    }
  }

  if (process.env.ALLOW_LOCAL_FFMPEG_TRANSCODE === "true" && process.env.FFMPEG_PATH?.trim()) {
    const { spawnLocalFfmpegHls } = await import("@/lib/video/ffmpeg-local");
    const result = await spawnLocalFfmpegHls(params);
    return result.ok ? { ok: true, mode: "local" } : { ok: false, error: result.error };
  }

  // Fallback: один MP4 через signed URL (плеер без HLS), статус ready без playlist
  return { ok: true, mode: "mp4_fallback" };
}

/** Webhook completion — записать HLS ключ в урок. */
export async function markLessonHlsReady(params: {
  lessonId: string;
  hlsPlaylistKey: string;
}): Promise<void> {
  const { createServiceRoleClient } = await import("@/utils/supabase/admin");
  const admin = createServiceRoleClient();
  await admin
    .from("course_lessons")
    .update({
      hls_playlist_key: params.hlsPlaylistKey,
      video_processing_status: "ready",
      video_upload_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.lessonId);
}

export { lessonSourceVideoKey, lessonHlsPlaylistKey };
