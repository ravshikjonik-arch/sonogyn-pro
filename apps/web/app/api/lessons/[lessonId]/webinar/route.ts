import { NextResponse } from "next/server";

import { canAccessWebinar, canHostWebinar } from "@/lib/webinars/access";
import { getLiveKitConfig, isLiveKitConfigured, mintLiveKitToken } from "@/lib/webinars/livekit";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type Params = { params: Promise<{ lessonId: string }> };

/** Состояние вебинара для урока. */
export async function GET(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { data: lesson } = await client.supabase
    .from("course_lessons")
    .select("id, course_id, title, lesson_type, duration_minutes, offline_starts_at, video_file_key, hls_playlist_key, video_processing_status")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.lesson_type !== "webinar") {
    return NextResponse.json({ error: "Вебинар не найден." }, { status: 404 });
  }

  const { data: course } = await client.supabase
    .from("courses")
    .select("id, title, price_rub, status")
    .eq("id", lesson.course_id as string)
    .maybeSingle();

  if (!course) {
    return NextResponse.json({ error: "Курс не найден." }, { status: 404 });
  }

  const { data: session } = await client.supabase
    .from("webinar_sessions")
    .select("*")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const hasAccess = await canAccessWebinar(client.supabase, user.id, lessonId);
  const isHost = await canHostWebinar(client.supabase, user.id, lessonId);

  const hasRecording =
    Boolean(lesson.hls_playlist_key && lesson.video_processing_status === "ready") ||
    Boolean(lesson.video_file_key);

  return NextResponse.json({
    ok: true,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      courseId: lesson.course_id,
      durationMinutes: lesson.duration_minutes,
    },
    course: {
      id: course.id,
      title: course.title,
      priceRub: course.price_rub,
    },
    session: session
      ? {
          id: session.id,
          status: session.status,
          scheduledAt: session.scheduled_at,
          startedAt: session.started_at,
          endedAt: session.ended_at,
        }
      : null,
    hasAccess,
    isHost,
    hasRecording,
    liveKitConfigured: isLiveKitConfigured(),
    liveKitUrl: hasAccess ? getLiveKitConfig()?.url ?? null : null,
  });
}

/** LiveKit JWT для комнаты вебинара. */
export async function POST(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const hasAccess = await canAccessWebinar(client.supabase, user.id, lessonId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Нет доступа. Оплатите курс." }, { status: 403 });
  }

  const isHost = await canHostWebinar(client.supabase, user.id, lessonId);

  const { data: session } = await client.supabase
    .from("webinar_sessions")
    .select("room_name, status")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Сессия вебинара не создана." }, { status: 404 });
  }

  if (!isHost && session.status !== "live" && session.status !== "scheduled") {
    return NextResponse.json({ error: "Эфир завершён. Смотрите запись." }, { status: 409 });
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json({ error: "LiveKit не настроен на сервере." }, { status: 503 });
  }

  const { data: profile } = await client.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = (profile?.full_name as string | null) ?? user.email ?? "Врач";

  try {
    const token = await mintLiveKitToken({
      roomName: session.room_name as string,
      identity: user.id,
      displayName,
      canPublish: isHost,
    });

    return NextResponse.json({
      ok: true,
      token,
      roomName: session.room_name,
      url: getLiveKitConfig()!.url,
      isHost,
      sessionStatus: session.status,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось выдать токен." },
      { status: 500 },
    );
  }
}
