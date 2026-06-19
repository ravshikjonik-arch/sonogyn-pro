import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { uploadCourseLessonVideo } from "@/lib/courses/storage";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase, userId }) => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Передайте видеофайл в поле file." }, { status: 400 });
    }

    const uploaded = await uploadCourseLessonVideo(supabase, { userId, courseId, file });
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("course_lessons")
      .update({
        video_storage_path: uploaded.path,
        video_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, lesson: data });
  });
}
