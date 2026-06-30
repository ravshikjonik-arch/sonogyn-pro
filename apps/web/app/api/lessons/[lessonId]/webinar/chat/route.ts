import { NextResponse } from "next/server";

import { canAccessWebinar, canHostWebinar } from "@/lib/webinars/access";
import { WebinarChatModerateSchema, WebinarChatPostSchema } from "@/lib/webinars/schemas";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { isUuid } from "@/lib/security/uuid";

type Params = { params: Promise<{ lessonId: string }> };

export async function GET(_req: Request, { params }: Params) {
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

  const hasAccess = await canAccessWebinar(client.supabase, user.id, lessonId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Нет доступа к чату." }, { status: 403 });
  }

  const { data: session } = await client.supabase
    .from("webinar_sessions")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ ok: true, messages: [] });
  }

  const { data: messages, error } = await client.supabase
    .from("webinar_chat_messages")
    .select("id, session_id, lesson_id, author_id, author_display_name, body, is_pinned, created_at")
    .eq("session_id", session.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, messages: messages ?? [], sessionId: session.id });
}

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

  const hasAccess = await canAccessWebinar(client.supabase, user.id, lessonId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Нет доступа к чату." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = WebinarChatPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: session } = await client.supabase
    .from("webinar_sessions")
    .select("id, status")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Сессия вебинара не найдена." }, { status: 404 });
  }

  const { data: profile } = await client.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: message, error } = await client.supabase
    .from("webinar_chat_messages")
    .insert({
      session_id: session.id,
      lesson_id: lessonId,
      author_id: user.id,
      author_display_name: (profile?.full_name as string | null) ?? null,
      body: parsed.data.body,
    })
    .select("id, session_id, lesson_id, author_id, author_display_name, body, is_pinned, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message });
}

export async function PATCH(req: Request, { params }: Params) {
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
    return NextResponse.json({ error: "Только лектор может модерировать чат." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = WebinarChatModerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.isHidden !== undefined) patch.is_hidden = parsed.data.isHidden;
  if (parsed.data.isPinned !== undefined) patch.is_pinned = parsed.data.isPinned;

  const { data, error } = await client.supabase
    .from("webinar_chat_messages")
    .update(patch)
    .eq("id", parsed.data.messageId)
    .eq("lesson_id", lessonId)
    .select("id, is_hidden, is_pinned")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}
