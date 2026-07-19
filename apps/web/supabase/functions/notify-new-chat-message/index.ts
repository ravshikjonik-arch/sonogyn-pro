import { createServiceSupabase, sendExpoPushBatch, verifyDiscussionWebhook } from "../_shared/expo-push.ts";

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
    .select("user_id")
    .eq("channel_id", row.channel_id)
    .neq("user_id", row.author_id);

  const userIds = (subscribers ?? []).map((s) => s.user_id as string);
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no_subscribers" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("expo_push_token")
    .in("user_id", userIds);

  const pushTokens = [...new Set((tokens ?? []).map((t) => t.expo_push_token as string))];
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

  return new Response(JSON.stringify({ ...result, tokens: pushTokens.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
