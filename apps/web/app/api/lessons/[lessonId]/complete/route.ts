import { NextResponse } from "next/server";

import { canAccessLessonPlayback } from "@/lib/lessons/playback-access";
import { markLessonCompleted } from "@/lib/courses/progress";
import { isEnrolledInCourse } from "@/lib/courses/student-access";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { isUuid } from "@/lib/security/uuid";

type Params = { params: Promise<{ lessonId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  if (!isUuid(lessonId)) {
    return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  }
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: lesson, error } = await client.supabase
    .from("course_lessons")
    .select("id, course_id, is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson) {
    return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  }

  const enrolled = await isEnrolledInCourse(client.supabase, user.id, lesson.course_id as string);
  if (!enrolled && !lesson.is_free_preview) {
    return NextResponse.json({ error: "Запишитесь на курс." }, { status: 403 });
  }

  const allowed = await canAccessLessonPlayback(client.supabase, user.id, {
    course_id: lesson.course_id as string,
    is_free_preview: lesson.is_free_preview as boolean,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await markLessonCompleted(client.supabase, {
    userId: user.id,
    courseId: lesson.course_id as string,
    lessonId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Геймификация: урок → XP (не блокируем ответ при ошибке Prisma)
  try {
    const { checkAndAwardAchievements, isPrismaConfigured } = await import("@/lib/achievements/engine");
    if (isPrismaConfigured()) {
      await checkAndAwardAchievements(user.id, {
        eventType: "lesson_complete",
        moduleId: "general",
      });
    }
  } catch (e) {
    console.warn("[lessons/complete] achievements", e);
  }

  return NextResponse.json({ ok: true, progressPercent: result.progressPercent });
}
