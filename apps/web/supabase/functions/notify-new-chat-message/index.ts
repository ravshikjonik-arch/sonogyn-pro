import { createServiceSupabase, sendExpoPushBatch, verifyDiscussionWebhook } from "../_shared/expo-push.ts";

const CHAT_PUSH_COOLDOWN_MS = 5 * 60 * 1000;

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    channel_id: string;
    author_id: string;
    body: string | null;
    media_type: "image" | "video" | null;
  };
};

type SubscriberRow = {
  user_id: string;
  last_chat_push_at: string | null;
};

function previewBody(body: string | null, mediaType: string | null): string {
  const text = body?.trim().replace(/\s+/g, " ") ?? "";
  if (text) return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  if (mediaType === "video") return "Видео УЗИ";
  if (mediaType === "image") return "Фото УЗИ";
  return "Новое сообщение";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createServiceSupabase();

  if (!(await verifyDiscussionWebhook(req, supabase))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const row = payload.record;
  if (payload.table !== "doctor_chat_messages" || payload.type !== "INSERT" || !row.channel_id) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: channel } = await supabase
    .from("doctor_chat_channels")
    .select("title, slug")
    .eq("id", row.channel_id)
    .maybeSingle();

  const { data: subscribers } = await supabase
    .from("channel_subscriptions")
    .select("user_id, last_chat_push_at")
    .eq("channel_id", row.channel_id)
    .neq("user_id", row.author_id);

  const now = Date.now();
  const eligible = ((subscribers ?? []) as SubscriberRow[]).filter((s) => {
    if (!s.last_chat_push_at) return true;
    const last = new Date(s.last_chat_push_at).getTime();
    return Number.isFinite(last) && now - last >= CHAT_PUSH_COOLDOWN_MS;
  });

  const userIds = eligible.map((s) => s.user_id);
  const suppressed = (subscribers?.length ?? 0) - userIds.length;

  if (userIds.length === 0) {
    return new Response(
      JSON.stringify({
        sent: 0,
        reason: (subscribers?.length ?? 0) === 0 ? "no_subscribers" : "cooldown",
        suppressed,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("user_id, expo_push_token")
    .in("user_id", userIds);

  const tokenRows = tokens ?? [];
  const pushTokens = [...new Set(tokenRows.map((t) => t.expo_push_token as string))];
  const notifiedUserIds = [
    ...new Set(tokenRows.map((t) => t.user_id as string).filter(Boolean)),
  ];

  const section = channel?.title ?? "чат";
  const title = `Чат · ${section}`;
  const preview = previewBody(row.body, row.media_type);

  const result = await sendExpoPushBatch(
    pushTokens.map((to) => ({
      to,
      title,
      body: preview,
      data: {
        type: "new_chat_message",
        channelId: row.channel_id,
        channelSlug: channel?.slug ?? "",
        messageId: row.id,
      },
      sound: "default",
    })),
  );

  if (notifiedUserIds.length > 0) {
    await supabase
      .from("channel_subscriptions")
      .update({ last_chat_push_at: new Date().toISOString() })
      .eq("channel_id", row.channel_id)
      .in("user_id", notifiedUserIds);
  }

  return new Response(
    JSON.stringify({ ...result, tokens: pushTokens.length, suppressed }),
    { headers: { "Content-Type": "application/json" } },
  );
});
