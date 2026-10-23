import {
  createServiceSupabase,
  filterUsersWithMessageNotifications,
  sendExpoPushBatch,
  verifyDiscussionWebhook,
} from "../_shared/expo-push.ts";
import { sendWebPushBatch } from "../_shared/web-push-vapid.ts";

const CHAT_PUSH_COOLDOWN_MS = 5 * 60 * 1000;

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: Record<string, unknown>;
};

type SubscriberRow = {
  user_id: string;
  last_chat_push_at: string | null;
};

type ResolvedMessage = {
  channelId: string;
  authorId: string;
  messageId: string;
  body: string | null;
  mediaType: "image" | "video" | null;
};

function previewBody(body: string | null, mediaType: string | null): string {
  const text = body?.trim().replace(/\s+/g, " ") ?? "";
  if (text) return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  if (mediaType === "video") return "Видео УЗИ";
  if (mediaType === "image") return "Фото УЗИ";
  return "Новое сообщение";
}

async function resolveFromV1(record: Record<string, unknown>): Promise<ResolvedMessage | null> {
  const channelId = typeof record.channel_id === "string" ? record.channel_id : null;
  const authorId = typeof record.author_id === "string" ? record.author_id : null;
  const messageId = typeof record.id === "string" ? record.id : null;
  if (!channelId || !authorId || !messageId) return null;
  const body = typeof record.body === "string" ? record.body : null;
  const mediaType =
    record.media_type === "image" || record.media_type === "video" ? record.media_type : null;
  return { channelId, authorId, messageId, body, mediaType };
}

async function resolveFromMessengerV2(
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
): Promise<ResolvedMessage | null> {
  const chatId = typeof record.chat_id === "string" ? record.chat_id : null;
  const authorId = typeof record.sender_id === "string" ? record.sender_id : null;
  const messageId = typeof record.id === "string" ? record.id : null;
  if (record.deleted_at) return null;
  if (!chatId || !authorId || !messageId) return null;

  const { data: chat } = await supabase
    .from("messenger_chats")
    .select("legacy_doctor_channel_id, title")
    .eq("id", chatId)
    .maybeSingle();

  const channelId = chat?.legacy_doctor_channel_id as string | null;
  if (!channelId) return null;

  const body = typeof record.body === "string" ? record.body : null;

  const { data: att } = await supabase
    .from("messenger_message_attachments")
    .select("media_type")
    .eq("message_id", messageId)
    .limit(1)
    .maybeSingle();

  const mediaType =
    att?.media_type === "image" || att?.media_type === "video" ? att.media_type : null;

  return { channelId, authorId, messageId, body, mediaType };
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

  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let resolved: ResolvedMessage | null = null;
  if (payload.table === "doctor_chat_messages") {
    resolved = await resolveFromV1(payload.record);
  } else if (payload.table === "messenger_messages") {
    resolved = await resolveFromMessengerV2(supabase, payload.record);
  }

  if (!resolved) {
    return new Response(JSON.stringify({ skipped: true, table: payload.table }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = resolved;

  const { data: channel } = await supabase
    .from("doctor_chat_channels")
    .select("title, slug")
    .eq("id", row.channelId)
    .maybeSingle();

  const { data: subscribers } = await supabase
    .from("channel_subscriptions")
    .select("user_id, last_chat_push_at")
    .eq("channel_id", row.channelId)
    .neq("user_id", row.authorId);

  const now = Date.now();
  const eligible = ((subscribers ?? []) as SubscriberRow[]).filter((s) => {
    if (!s.last_chat_push_at) return true;
    const last = new Date(s.last_chat_push_at).getTime();
    return Number.isFinite(last) && now - last >= CHAT_PUSH_COOLDOWN_MS;
  });

  const cooldownEligibleIds = eligible.map((s) => s.user_id);
  const cooldownSuppressed = (subscribers?.length ?? 0) - cooldownEligibleIds.length;

  const { allowed: userIds, suppressed: prefSuppressed } = await filterUsersWithMessageNotifications(
    supabase,
    cooldownEligibleIds,
  );
  const suppressed = cooldownSuppressed + prefSuppressed;

  if (userIds.length === 0) {
    return new Response(
      JSON.stringify({
        sent: 0,
        reason:
          (subscribers?.length ?? 0) === 0
            ? "no_subscribers"
            : prefSuppressed > 0 && cooldownEligibleIds.length === prefSuppressed
              ? "notifications_disabled"
              : "cooldown",
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
  const expoNotifiedUserIds = [
    ...new Set(tokenRows.map((t) => t.user_id as string).filter(Boolean)),
  ];

  const section = channel?.title ?? "чат";
  const title = `Чат · ${section}`;
  const preview = previewBody(row.body, row.mediaType);

  const pushData = {
    type: "new_chat_message",
    channelId: row.channelId,
    channelSlug: channel?.slug ?? "",
    messageId: row.messageId,
    source: payload.table === "messenger_messages" ? "messenger_v2" : "doctor_chat_v1",
  };

  const result = await sendExpoPushBatch(
    pushTokens.map((to) => ({
      to,
      title,
      body: preview,
      data: pushData,
      sound: "default",
    })),
  );

  const { data: webSubs } = await supabase
    .from("web_push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .in("user_id", userIds);

  const webPush = await sendWebPushBatch(
    (webSubs ?? []).map((s) => ({
      endpoint: s.endpoint as string,
      p256dh: s.p256dh as string,
      auth_key: s.auth_key as string,
    })),
    { title, body: preview, data: pushData },
  );

  const notifiedUserIds = [...new Set([...expoNotifiedUserIds, ...userIds])];

  if (notifiedUserIds.length > 0) {
    await supabase
      .from("channel_subscriptions")
      .update({ last_chat_push_at: new Date().toISOString() })
      .eq("channel_id", row.channelId)
      .in("user_id", notifiedUserIds);
  }

  return new Response(
    JSON.stringify({
      ...result,
      tokens: pushTokens.length,
      webPush,
      suppressed,
      table: payload.table,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
