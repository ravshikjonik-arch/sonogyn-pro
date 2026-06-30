import { NextResponse } from "next/server";

import { canHostWebinar } from "@/lib/webinars/access";
import { WebinarLifecycleSchema } from "@/lib/webinars/schemas";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { isUuid } from "@/lib/security/uuid";

type Params = { params: Promise<{ lessonId: string }> };

/** Лектор: начать или завершить эфир. */
export async function POST(req: Request, { params }: Params) {
  const { lessonId } = await params;
  if (!isUuid(lessonId)) {
    return NextResponse.json({ error: "Вебинар не найден." }, { status: 404 });
  }
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

  const isHost = await canHostWebinar(client.supabase, user.id, lessonId);
  if (!isHost) {
    return NextResponse.json({ error: "Только лектор может управлять эфиром." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = WebinarLifecycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (parsed.data.action === "start") {
    const { data, error } = await client.supabase
      .from("webinar_sessions")
      .update({ status: "live", started_at: now, updated_at: now })
      .eq("lesson_id", lessonId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, session: data });
  }

  const { data, error } = await client.supabase
    .from("webinar_sessions")
    .update({ status: "ended", ended_at: now, updated_at: now })
    .eq("lesson_id", lessonId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, session: data });
}
