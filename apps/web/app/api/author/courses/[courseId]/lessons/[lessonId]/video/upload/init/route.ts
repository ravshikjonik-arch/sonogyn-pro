import { NextResponse } from "next/server";

import { withAuthorLessonCourseApi } from "@/lib/courses/api-handler";
import {
  ALLOWED_VIDEO_EXT,
  isObjectStorageConfigured,
  lessonSourceVideoKey,
  MULTIPART_PART_SIZE,
  readStorageConfig,
} from "@/lib/storage/config";
import { createMultipartUpload } from "@/lib/storage/s3";
import {
  AuthorVideoUploadInitBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

function extFromFileName(name: string): string {
  const m = name.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return m?.[1] ?? ".mp4";
}

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorLessonCourseApi(courseId, lessonId, async ({ supabase }) => {
    if (!isObjectStorageConfigured()) {
      return NextResponse.json({ error: "Object Storage не настроен (STORAGE_* или BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
    }

    if (readStorageConfig().provider === "vercel-blob") {
      return NextResponse.json({ ok: true, mode: "vercel-blob" as const });
    }

    const parsedJson = await parseJsonBody(req);
    if (!parsedJson.ok) return parsedJson.response;

    const parsed = AuthorVideoUploadInitBodySchema.safeParse(parsedJson.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const ext = extFromFileName(parsed.data.fileName);
    if (!ALLOWED_VIDEO_EXT.has(ext)) {
      return NextResponse.json({ error: "Допустимы только .mp4 и .webm." }, { status: 400 });
    }

    const key = lessonSourceVideoKey(courseId, lessonId, ext);

    const { uploadId } = await createMultipartUpload({
      key,
      contentType: parsed.data.mimeType,
    });

    await supabase
      .from("course_lessons")
      .update({
        video_processing_status: "uploading",
        video_upload_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("course_id", courseId);

    const partCount = Math.ceil(parsed.data.fileSize / MULTIPART_PART_SIZE);

    return NextResponse.json({
      ok: true,
      uploadId,
      key,
      partSize: MULTIPART_PART_SIZE,
      partCount,
    });
  });
}
