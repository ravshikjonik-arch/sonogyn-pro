import { NextResponse } from "next/server";

import { withAuthorLessonCourseApi } from "@/lib/courses/api-handler";
import { presignUploadPart } from "@/lib/storage/s3";
import {
  AuthorVideoMultipartSignPartBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorLessonCourseApi(courseId, lessonId, async () => {
    const parsedJson = await parseJsonBody(req);
    if (!parsedJson.ok) return parsedJson.response;

    const parsed = AuthorVideoMultipartSignPartBodySchema.safeParse(parsedJson.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const url = await presignUploadPart({
      key: parsed.data.key,
      uploadId: parsed.data.uploadId,
      partNumber: parsed.data.partNumber,
    });

    return NextResponse.json({ ok: true, url, partNumber: parsed.data.partNumber });
  });
}
