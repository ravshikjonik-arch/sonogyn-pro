import {
  createServiceSupabase,
  filterUsersWithMessageNotifications,
  sendExpoPushBatch,
  verifyDiscussionWebhook,
} from "../_shared/expo-push.ts";

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    channel_id: string | null;
  };
};

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
  if (payload.table !== "cases" || payload.type !== "INSERT" || !row.channel_id) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: channel } = await supabase
    .from("doctor_chat_channels")
    .select("title")
    .eq("id", row.channel_id)
    .maybeSingle();

  const { data: subscribers } = await supabase
    .from("channel_subscriptions")
    .select("user_id")
    .eq("channel_id", row.channel_id)
    .neq("user_id", row.user_id);

  const subscriberIds = (subscribers ?? []).map((s) => s.user_id as string);
  if (subscriberIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no_subscribers" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { allowed: userIds, suppressed } = await filterUsersWithMessageNotifications(
    supabase,
    subscriberIds,
  );
  if (userIds.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "notifications_disabled", suppressed }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("expo_push_token")
    .in("user_id", userIds);

  const pushTokens = [...new Set((tokens ?? []).map((t) => t.expo_push_token as string))];
  const section = channel?.title ?? "раздел";
  const title = `Новый вопрос · ${section}`;
  const preview = (row.description ?? row.title).slice(0, 120);

  const result = await sendExpoPushBatch(
    pushTokens.map((to) => ({
      to,
      title,
      body: preview,
      data: { caseId: row.id, channelId: row.channel_id!, type: "new_question" },
      sound: "default",
    })),
  );

  return new Response(JSON.stringify({ ...result, tokens: pushTokens.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
