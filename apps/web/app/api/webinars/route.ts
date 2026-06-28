import { NextResponse } from "next/server";

import { createCourseAdminClient } from "@/lib/courses/admin-client";
import { canAccessWebinar, canHostWebinar } from "@/lib/webinars/access";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import type { WebinarListItem } from "@/lib/webinars/types";

/** Каталог вебинаров: предстоящие и архив. */
export async function GET() {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const admin = createCourseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  const { data: rows, error } = await admin
    .from("webinar_sessions")
    .select(
      `
      id,
      status,
      scheduled_at,
      lesson_id,
      course_id,
      course_lessons!inner (
        id,
        title,
        duration_minutes,
        lesson_type
      ),
      courses!inner (
        id,
        title,
        price_rub,
        status,
        author_id
      )
    `,
    )
    .eq("course_lessons.lesson_type", "webinar")
    .eq("courses.status", "published")
    .order("scheduled_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: WebinarListItem[] = [];

  for (const row of rows ?? []) {
    const lessonRaw = row.course_lessons;
    const courseRaw = row.courses;
    const lesson = (Array.isArray(lessonRaw) ? lessonRaw[0] : lessonRaw) as {
      id: string;
      title: string;
      duration_minutes: number | null;
    };
    const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as {
      id: string;
      title: string;
      price_rub: number;
      author_id: string;
    };

    if (!lesson || !course) continue;

    let hasAccess = false;
    let isHost = false;
    let authorName: string | null = null;

    if (user) {
      hasAccess = await canAccessWebinar(client.supabase, user.id, lesson.id);
      isHost = await canHostWebinar(client.supabase, user.id, lesson.id);
    }

    const { data: authorProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", course.author_id)
      .maybeSingle();
    authorName = (authorProfile?.full_name as string | null) ?? null;

    items.push({
      lessonId: lesson.id,
      courseId: course.id,
      courseTitle: course.title,
      lessonTitle: lesson.title,
      priceRub: course.price_rub as number,
      scheduledAt: row.scheduled_at as string,
      status: row.status as WebinarListItem["status"],
      durationMinutes: lesson.duration_minutes,
      authorName,
      hasAccess,
      isHost,
    });
  }

  const live = items.filter((i) => i.status === "live");
  const upcoming = items
    .filter((i) => i.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const archive = items.filter((i) => i.status === "ended");

  return NextResponse.json({ ok: true, live, upcoming, archive });
}
