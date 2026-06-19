import { NextResponse } from "next/server";
import { z } from "zod";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { presignUploadPart } from "@/lib/storage/s3";

const bodySchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: z.number().int().min(1).max(10_000),
});

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async () => {
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const url = await presignUploadPart({
      key: parsed.data.key,
      uploadId: parsed.data.uploadId,
      partNumber: parsed.data.partNumber,
    });

    return NextResponse.json({ ok: true, url, partNumber: parsed.data.partNumber });
  });
}
