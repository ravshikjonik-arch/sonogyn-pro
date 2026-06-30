import { NextResponse } from "next/server";

import { VideoTranscodeWebhookBodySchema } from "@/lib/security/api-body-schemas";
import { markLessonHlsReady } from "@/lib/video/transcode";

export async function POST(req: Request) {
  const expected = process.env.VIDEO_TRANSCODE_WEBHOOK_SECRET?.trim();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = VideoTranscodeWebhookBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!expected) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      return NextResponse.json({ error: "VIDEO_TRANSCODE_WEBHOOK_SECRET is not configured" }, { status: 503 });
    }
  } else if (parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await markLessonHlsReady({
    lessonId: parsed.data.lessonId,
    hlsPlaylistKey: parsed.data.hlsPlaylistKey,
  });

  return NextResponse.json({ ok: true });
}
