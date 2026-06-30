import { NextResponse } from "next/server";

import { withAuthorLessonCourseApi } from "@/lib/courses/api-handler";
import { completeMultipartUpload } from "@/lib/storage/s3";
import { triggerLessonVideoTranscode } from "@/lib/video/transcode";
import {
  AuthorVideoMultipartCompleteBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorLessonCourseApi(courseId, lessonId, async ({ supabase }) => {
    const parsedJson = await parseJsonBody(req);
    if (!parsedJson.ok) return parsedJson.response;

    const parsed = AuthorVideoMultipartCompleteBodySchema.safeParse(parsedJson.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);

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
