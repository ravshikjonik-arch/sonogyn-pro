import { NextResponse } from "next/server";

import { fetchPublishedCourseDetail } from "@/lib/courses/public-queries";
import { canAccessCourseContent } from "@/lib/courses/student-access";
import { fetchCourseProgress } from "@/lib/courses/progress";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type Params = { params: Promise<{ courseId: string }> };

/** Публичная карточка опубликованного курса. */
export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const course = await fetchPublishedCourseDetail(client.supabase, courseId);
  if (!course) {
    return NextResponse.json({ error: "Курс не найден." }, { status: 404 });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  let enrolled = false;
  let progressPercent = 0;
  if (user) {
    enrolled = await canAccessCourseContent(client.supabase, user.id, courseId);
    if (enrolled) {
      const progress = await fetchCourseProgress(client.supabase, user.id, courseId);
      progressPercent = progress.progressPercent;
    }
  }

  return NextResponse.json({
    ok: true,
    course: {
      id: course.id,
      title: course.title,
      description_html: course.description_html,
      price_rub: course.price_rub,
      coverUrl: course.coverUrl,
      lessonCount: course.lessonCount,
      author: course.author,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        sort_order: m.sort_order,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          lesson_type: l.lesson_type,
          duration_minutes: l.duration_minutes,
          is_free_preview: l.is_free_preview,
          sort_order: l.sort_order,
          locked: !enrolled && !l.is_free_preview,
        })),
      })),
    },
    enrolled,
    progressPercent,
  });
}
