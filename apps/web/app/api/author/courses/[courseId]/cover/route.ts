import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { uploadCourseCover } from "@/lib/courses/storage";
import { UuidPathSchema, zodErrorResponse } from "@/lib/security/api-body-schemas";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId: rawCourseId } = await params;
  const courseIdParsed = UuidPathSchema.safeParse(rawCourseId);
  if (!courseIdParsed.success) {
    return zodErrorResponse(courseIdParsed.error, 404);
  }
  const courseId = courseIdParsed.data;

  return withAuthorCourseApi(courseId, async ({ supabase, userId }) => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Передайте файл в поле file." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Обложка: файл до 5 МБ." }, { status: 400 });
    }

    const uploaded = await uploadCourseCover(supabase, { userId, courseId, file });
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    const { error } = await supabase
      .from("courses")
      .update({ cover_storage_path: uploaded.path, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, path: uploaded.path });
  });
}
