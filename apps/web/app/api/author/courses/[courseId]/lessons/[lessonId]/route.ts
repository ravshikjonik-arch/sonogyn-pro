import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { LessonUpsertSchema } from "@/lib/courses/schemas";
import { sanitizeLessonUpsertFields } from "@/lib/courses/sanitize-upsert";
import { resolveVideoProvider } from "@/lib/courses/video-url";
import { syncWebinarSessionAfterLessonSave } from "@/lib/webinars/author-sync";

type Params = { params: Promise<{ courseId: string; lessonId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { courseId, lessonId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = LessonUpsertSchema.partial().extend({ module_id: LessonUpsertSchema.shape.module_id.optional() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const safe = sanitizeLessonUpsertFields(parsed.data);
    const patch: Record<string, unknown> = { ...safe, updated_at: new Date().toISOString() };
    if (safe.video_url !== undefined) {
      patch.video_provider = resolveVideoProvider({ videoUrl: safe.video_url });
    }

    const { data, error } = await supabase
      .from("course_lessons")
      .update(patch)
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const lessonType = (data.lesson_type as string) ?? parsed.data.lesson_type;
    const scheduledAt =
      parsed.data.offline_starts_at !== undefined
        ? parsed.data.offline_starts_at
        : (data.offline_starts_at as string | null);

    await syncWebinarSessionAfterLessonSave(supabase, {
      lessonId,
      courseId,
      lessonType: lessonType ?? "video",
      scheduledAt,
    });

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
