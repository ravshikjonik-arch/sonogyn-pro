import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { withAuthorLessonCourseApi } from "@/lib/courses/api-handler";
import {
  ALLOWED_VIDEO_MIME,
  MAX_LESSON_VIDEO_BYTES,
  isObjectStorageConfigured,
  readStorageConfig,
} from "@/lib/storage/config";
import {
  AuthorVideoBlobUploadBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

/** Client upload token для Vercel Blob (mp4/webm до 2 ГБ). */
export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;

  return withAuthorLessonCourseApi(courseId, lessonId, async () => {
    const cfg = readStorageConfig();
    if (cfg.provider !== "vercel-blob" || !isObjectStorageConfigured()) {
      return NextResponse.json({ error: "Vercel Blob не настроен (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
    }

    const parsedJson = await parseJsonBody(req);
    if (!parsedJson.ok) return parsedJson.response;

    const parsed = AuthorVideoBlobUploadBodySchema.safeParse(parsedJson.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const body = parsed.data as unknown as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: [...ALLOWED_VIDEO_MIME],
          maximumSizeInBytes: MAX_LESSON_VIDEO_BYTES,
          access: "private",
          tokenPayload: JSON.stringify({ courseId, lessonId }),
        }),
      });
      return NextResponse.json(jsonResponse);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Blob upload token failed" },
        { status: 500 },
      );
    }
  });
}
