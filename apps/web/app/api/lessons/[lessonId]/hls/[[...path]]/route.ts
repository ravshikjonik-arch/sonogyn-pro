import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { canAccessLessonPlayback } from "@/lib/lessons/playback-access";
import { getBucket, getS3Client } from "@/lib/storage/s3";
import { resolveHlsObjectKey } from "@/lib/video/hls-object-key";
import { rewriteHlsPlaylist } from "@/lib/video/hls-playlist";
import { verifyPlaybackToken } from "@/lib/video/playback-token";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ lessonId: string; path?: string[] }> };

export async function GET(req: Request, { params }: Params) {
  const { lessonId, path } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  if (!verifyPlaybackToken(token, lessonId, auth.userId)) {
    return NextResponse.json({ error: "Ссылка просмотра истекла." }, { status: 403 });
  }

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("course_id, hls_playlist_key, is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson?.hls_playlist_key) {
    return NextResponse.json({ error: "HLS не готов." }, { status: 404 });
  }

  const allowed = await canAccessLessonPlayback(supabase, auth.userId, {
    course_id: lesson.course_id as string,
    is_free_preview: lesson.is_free_preview as boolean,
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const objectKey = resolveHlsObjectKey(lesson.hls_playlist_key as string, path);
  if (!objectKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getS3Client();
  const res = await client.send(new GetObjectCommand({ Bucket: getBucket(), Key: objectKey }));
  const body = res.Body;
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await body.transformToByteArray();
  const isPlaylist = objectKey.endsWith(".m3u8");

  if (isPlaylist) {
    const text = new TextDecoder().decode(bytes);
    const origin = new URL(req.url).origin;
    const proxyBase = `${origin}/api/lessons/${lessonId}/hls/`;
    const rewritten = rewriteHlsPlaylist(text, proxyBase, token);
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "video/mp2t",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
