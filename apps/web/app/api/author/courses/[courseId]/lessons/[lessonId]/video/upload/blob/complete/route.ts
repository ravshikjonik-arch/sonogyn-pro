import { NextResponse } from "next/server";

import { withAuthorLessonCourseApi } from "@/lib/courses/api-handler";
import {
  AuthorVideoBlobCompleteBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

/** Сохранить Vercel Blob URL в урок (mp4 ready без HLS). */
export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;

  return withAuthorLessonCourseApi(courseId, lessonId, async ({ supabase }) => {
    const parsedJson = await parseJsonBody(req);
    if (!parsedJson.ok) return parsedJson.response;

    const parsed = AuthorVideoBlobCompleteBodySchema.safeParse(parsedJson.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);

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
