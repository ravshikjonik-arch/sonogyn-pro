import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { completeMultipartUpload } from "@/lib/storage/s3";
import { triggerLessonVideoTranscode } from "@/lib/video/transcode";

const bodySchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(
    z.object({
      PartNumber: z.number().int(),
      ETag: z.string().min(1),
    }),
  ),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await completeMultipartUpload({
      key: parsed.data.key,
      uploadId: parsed.data.uploadId,
      parts: parsed.data.parts,
    });

    const videoFileUrl = parsed.data.key;

    await supabase
      .from("course_lessons")
      .update({
        video_file_key: parsed.data.key,
        video_file_url: videoFileUrl,
        video_storage_path: null,
        video_url: null,
        video_mime_type: parsed.data.mimeType,
        video_size_bytes: parsed.data.fileSize,
        video_processing_status: "processing",
        video_upload_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("course_id", courseId);

    const transcode = await triggerLessonVideoTranscode({
      courseId,
      lessonId,
      sourceKey: parsed.data.key,
      mimeType: parsed.data.mimeType,
    });

    if (!transcode.ok) {
      await supabase
        .from("course_lessons")
        .update({
          video_processing_status: "failed",
          video_upload_error: transcode.error,
        })
        .eq("id", lessonId);
      return NextResponse.json({ error: transcode.error }, { status: 502 });
    }

    if (transcode.mode === "mp4_fallback") {
      await supabase
        .from("course_lessons")
        .update({ video_processing_status: "ready" })
        .eq("id", lessonId);
    }

    return NextResponse.json({
      ok: true,
      videoFileUrl,
      videoFileKey: parsed.data.key,
      processingStatus: transcode.mode === "mp4_fallback" ? "ready" : "processing",
      transcodeMode: transcode.mode,
    });
  });
}
