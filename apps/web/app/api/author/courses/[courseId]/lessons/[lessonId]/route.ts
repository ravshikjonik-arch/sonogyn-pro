import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { LessonUpsertSchema } from "@/lib/courses/schemas";
import { resolveVideoProvider } from "@/lib/courses/video-url";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = LessonUpsertSchema.partial().extend({ module_id: LessonUpsertSchema.shape.module_id.optional() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const patch: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
    if (parsed.data.video_url !== undefined) {
      patch.video_provider = resolveVideoProvider({ videoUrl: parsed.data.video_url });
    }

    const { data, error } = await supabase
      .from("course_lessons")
      .update(patch)
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, lesson: data });
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId).eq("course_id", courseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  });
}
