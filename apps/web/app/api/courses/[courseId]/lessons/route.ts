import { NextResponse } from "next/server";

import { countOfflineSeats } from "@/lib/courses/offline-seats";
import { sanitizeLessonForPublic } from "@/lib/courses/public-queries";
import { canAccessCourseContent } from "@/lib/courses/student-access";
import { fetchCourseProgress } from "@/lib/courses/progress";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type Params = { params: Promise<{ courseId: string }> };

/** Уроки курса — полные данные при наличии доступа. */
export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { data: course } = await client.supabase
    .from("courses")
    .select("id, status")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Курс недоступен." }, { status: 404 });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите для просмотра уроков." }, { status: 401 });
  }

  const hasAccess = await canAccessCourseContent(client.supabase, user.id, courseId);

  const { data: lessons, error } = await client.supabase
    .from("course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progress = hasAccess ? await fetchCourseProgress(client.supabase, user.id, courseId) : null;

  return NextResponse.json({
    ok: true,
    hasAccess,
    progressPercent: progress?.progressPercent ?? 0,
    completedLessonIds: progress?.completedLessonIds ?? [],
    lessons: await Promise.all(
      (lessons ?? []).map(async (lesson) => {
        const canView = hasAccess || (lesson.is_free_preview as boolean);
        const base = sanitizeLessonForPublic(lesson as Record<string, unknown>, canView);
        if (canView && lesson.lesson_type === "offline") {
          const seats = await countOfflineSeats(client.supabase, lesson.id as string);
          const { data: reg } = await client.supabase
            .from("offline_lesson_registrations")
            .select("status")
            .eq("lesson_id", lesson.id)
            .eq("user_id", user.id)
            .maybeSingle();
          return {
            ...base,
            offline_seats: seats,
            user_registered: reg?.status === "registered",
          };
        }
        if (canView && lesson.lesson_type === "webinar") {
          const { data: session } = await client.supabase
            .from("webinar_sessions")
            .select("status, scheduled_at")
            .eq("lesson_id", lesson.id)
            .maybeSingle();
          return {
            ...base,
            webinar_session: session
              ? { status: session.status, scheduledAt: session.scheduled_at }
              : null,
            webinar_href: `/library/webinars/${lesson.id}`,
          };
        }
        return base;
      }),
    ),
  });
}
