import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { LessonReorderSchema, LessonUpsertSchema } from "@/lib/courses/schemas";
import { sanitizeLessonUpsertFields } from "@/lib/courses/sanitize-upsert";
import { resolveVideoProvider } from "@/lib/courses/video-url";
import { syncWebinarSessionAfterLessonSave } from "@/lib/webinars/author-sync";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = LessonUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const safe = sanitizeLessonUpsertFields(parsed.data);

    const { data: last } = await supabase
      .from("course_lessons")
      .select("sort_order")
      .eq("module_id", parsed.data.module_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sort_order = (last?.sort_order ?? -1) + 1;

    const videoProvider = resolveVideoProvider({ videoUrl: safe.video_url });

    const { data, error } = await supabase
      .from("course_lessons")
      .insert({
        course_id: courseId,
        module_id: safe.module_id,
        title: safe.title,
        body_html: safe.body_html ?? "",
        description: safe.description ?? null,
        lesson_type: safe.lesson_type,
        video_url: safe.video_url ?? null,
        video_provider: videoProvider,
        duration_minutes: safe.duration_minutes ?? null,
        offline_starts_at: safe.offline_starts_at ?? null,
        offline_address: safe.offline_address ?? null,
        offline_stream_url: safe.offline_stream_url ?? null,
        max_seats: safe.max_seats ?? null,
        is_free_preview: safe.is_free_preview ?? false,
        sort_order,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await syncWebinarSessionAfterLessonSave(supabase, {
      lessonId: data.id as string,
      courseId,
      lessonType: safe.lesson_type,
      scheduledAt: safe.offline_starts_at ?? null,
    });

    return NextResponse.json({ ok: true, lesson: data });
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = LessonReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await Promise.all(
      parsed.data.lessonIds.map((id, index) =>
        supabase
          .from("course_lessons")
          .update({ sort_order: index, module_id: parsed.data.module_id })
          .eq("id", id)
          .eq("course_id", courseId),
      ),
    );

    return NextResponse.json({ ok: true });
  });
}
