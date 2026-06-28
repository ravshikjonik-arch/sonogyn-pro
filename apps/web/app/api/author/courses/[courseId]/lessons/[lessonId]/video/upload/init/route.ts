import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import {
  ALLOWED_VIDEO_EXT,
  ALLOWED_VIDEO_MIME,
  isObjectStorageConfigured,
  lessonSourceVideoKey,
  MAX_LESSON_VIDEO_BYTES,
  MULTIPART_PART_SIZE,
  readStorageConfig,
} from "@/lib/storage/config";
import { createMultipartUpload } from "@/lib/storage/s3";

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(MAX_LESSON_VIDEO_BYTES),
  mimeType: z.string().min(1),
});

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

function extFromFileName(name: string): string {
  const m = name.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return m?.[1] ?? ".mp4";
}

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    if (!isObjectStorageConfigured()) {
      return NextResponse.json({ error: "Object Storage не настроен (STORAGE_* или BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
    }

    if (readStorageConfig().provider === "vercel-blob") {
      return NextResponse.json({ ok: true, mode: "vercel-blob" as const });
    }

    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const ext = extFromFileName(parsed.data.fileName);
    if (!ALLOWED_VIDEO_EXT.has(ext) || !ALLOWED_VIDEO_MIME.has(parsed.data.mimeType)) {
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
