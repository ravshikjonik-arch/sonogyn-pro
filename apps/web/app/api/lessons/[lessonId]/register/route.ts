import { NextResponse } from "next/server";

import { countOfflineSeats } from "@/lib/courses/offline-seats";
import { notifyOfflineRegistrationSafe } from "@/lib/courses/lms-notify";
import { isEnrolledInCourse } from "@/lib/courses/student-access";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { isUuid } from "@/lib/security/uuid";

type Params = { params: Promise<{ lessonId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  if (!isUuid(lessonId)) {
    return NextResponse.json({ error: "Офлайн-лекция не найдена." }, { status: 404 });
  }
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите для записи." }, { status: 401 });
  }

  const { data: lesson, error } = await client.supabase
    .from("course_lessons")
    .select("id, course_id, title, lesson_type, max_seats, offline_starts_at, is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !lesson || lesson.lesson_type !== "offline") {
    return NextResponse.json({ error: "Офлайн-лекция не найдена." }, { status: 404 });
  }

  const enrolled = await isEnrolledInCourse(client.supabase, user.id, lesson.course_id as string);
  if (!enrolled && !lesson.is_free_preview) {
    return NextResponse.json({ error: "Запишитесь на курс." }, { status: 403 });
  }

  const seats = await countOfflineSeats(client.supabase, lessonId);
  if (seats.maxSeats != null && seats.remaining === 0) {
    return NextResponse.json({ error: "Мест больше нет." }, { status: 409 });
  }

  const { data: existing } = await client.supabase
    .from("offline_lesson_registrations")
    .select("id, status")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "registered") {
    return NextResponse.json({ ok: true, alreadyRegistered: true });
  }

  const { error: insertErr } = await client.supabase.from("offline_lesson_registrations").upsert(
    {
      lesson_id: lessonId,
      course_id: lesson.course_id,
      user_id: user.id,
      status: "registered",
      registered_at: new Date().toISOString(),
    },
    { onConflict: "lesson_id,user_id" },
  );

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  notifyOfflineRegistrationSafe({
    userId: user.id,
    lessonId,
    courseId: lesson.course_id as string,
    lessonTitle: lesson.title as string,
    startsAt: lesson.offline_starts_at as string | null,
  });

  return NextResponse.json({ ok: true, seats: await countOfflineSeats(client.supabase, lessonId) });
}
