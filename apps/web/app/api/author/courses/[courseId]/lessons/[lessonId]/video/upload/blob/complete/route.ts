import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";

const bodySchema = z.object({
  url: z.string().url(),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileName: z.string().min(1),
});

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

/** Сохранить Vercel Blob URL в урок (mp4 ready без HLS). */
export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;

  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { error } = await supabase
      .from("course_lessons")
      .update({
        video_file_key: parsed.data.url,
        video_file_url: parsed.data.url,
        video_storage_path: null,
        video_url: null,
        video_mime_type: parsed.data.mimeType,
        video_size_bytes: parsed.data.fileSize,
        video_processing_status: "ready",
        video_upload_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("course_id", courseId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      videoFileUrl: parsed.data.url,
      videoFileKey: parsed.data.url,
      processingStatus: "ready",
      transcodeMode: "mp4_fallback",
    });
  });
}
