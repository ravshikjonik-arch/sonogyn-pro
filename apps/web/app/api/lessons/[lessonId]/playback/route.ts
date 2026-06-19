import { NextResponse } from "next/server";

import { canAccessLessonPlayback } from "@/lib/lessons/playback-access";
import { createPlaybackToken, presignPlaybackUrl } from "@/lib/video/playback-token";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ lessonId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const { data: lesson, error } = await supabase
    .from("course_lessons")
    .select(
      "id, course_id, lesson_type, video_url, video_file_key, hls_playlist_key, video_processing_status, is_free_preview",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson) {
    return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  }

  const allowed = await canAccessLessonPlayback(supabase, auth.userId, {
    course_id: lesson.course_id as string,
    is_free_preview: lesson.is_free_preview as boolean,
  });

  if (!allowed) {
    return NextResponse.json({ error: "Нет доступа к уроку." }, { status: 403 });
  }

  if (lesson.video_url) {
    return NextResponse.json({
      ok: true,
      kind: "external",
      url: lesson.video_url as string,
    });
  }

  const token = createPlaybackToken(lessonId, auth.userId);
  const hlsKey = lesson.hls_playlist_key as string | null;
  const fileKey = lesson.video_file_key as string | null;
  const status = lesson.video_processing_status as string;

  if (hlsKey && status === "ready") {
    return NextResponse.json({
      ok: true,
      kind: "hls",
      url: `/api/lessons/${lessonId}/hls/master.m3u8?token=${encodeURIComponent(token)}`,
      expiresInSec: 3600,
    });
  }

  if (fileKey && (status === "ready" || status === "processing")) {
    const signedUrl = await presignPlaybackUrl(fileKey, 3600);
    return NextResponse.json({
      ok: true,
      kind: "mp4",
      url: signedUrl,
      expiresInSec: 3600,
      processing: status === "processing",
    });
  }

  return NextResponse.json({ error: "Видео ещё не готово." }, { status: 404 });
}
