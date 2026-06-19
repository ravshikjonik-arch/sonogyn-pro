import { NextResponse } from "next/server";
import { z } from "zod";

import { markLessonHlsReady } from "@/lib/video/transcode";

const bodySchema = z.object({
  lessonId: z.string().uuid(),
  hlsPlaylistKey: z.string().min(1),
  secret: z.string().optional(),
});

export async function POST(req: Request) {
  const expected = process.env.VIDEO_TRANSCODE_WEBHOOK_SECRET?.trim();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (expected && parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await markLessonHlsReady({
    lessonId: parsed.data.lessonId,
    hlsPlaylistKey: parsed.data.hlsPlaylistKey,
  });

  return NextResponse.json({ ok: true });
}
