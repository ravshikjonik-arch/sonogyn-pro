import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { LessonReorderSchema, LessonUpsertSchema } from "@/lib/courses/schemas";
import { resolveVideoProvider } from "@/lib/courses/video-url";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = LessonUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data: last } = await supabase
      .from("course_lessons")
      .select("sort_order")
      .eq("module_id", parsed.data.module_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sort_order = (last?.sort_order ?? -1) + 1;

    const videoProvider = resolveVideoProvider({ videoUrl: parsed.data.video_url });

    const { data, error } = await supabase
      .from("course_lessons")
      .insert({
        course_id: courseId,
        module_id: parsed.data.module_id,
        title: parsed.data.title,
        body_html: parsed.data.body_html ?? "",
        description: parsed.data.description ?? null,
        lesson_type: parsed.data.lesson_type,
        video_url: parsed.data.video_url ?? null,
        video_provider: videoProvider,
        duration_minutes: parsed.data.duration_minutes ?? null,
        offline_starts_at: parsed.data.offline_starts_at ?? null,
        offline_address: parsed.data.offline_address ?? null,
        offline_stream_url: parsed.data.offline_stream_url ?? null,
        max_seats: parsed.data.max_seats ?? null,
        is_free_preview: parsed.data.is_free_preview ?? false,
        sort_order,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
