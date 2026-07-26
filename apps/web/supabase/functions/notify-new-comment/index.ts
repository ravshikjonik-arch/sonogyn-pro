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
    case_id: string;
    author_id: string;
    body: string;
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

  if (payload.table !== "teaching_case_comments" || payload.type !== "INSERT") {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { case_id, author_id, body } = payload.record;

  const { data: caseRow } = await supabase
    .from("cases")
    .select("title,channel_id")
    .eq("id", case_id)
    .maybeSingle();

  const { data: subscribers } = await supabase
    .from("case_subscriptions")
    .select("user_id")
    .eq("case_id", case_id)
    .neq("user_id", author_id);

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
  const title = caseRow?.title ? `Новый ответ · ${caseRow.title}` : "Новый ответ в обсуждении";
  const preview = body.length > 120 ? `${body.slice(0, 117)}…` : body;

  const result = await sendExpoPushBatch(
    pushTokens.map((to) => ({
      to,
      title,
      body: preview,
      data: { caseId: case_id, type: "new_comment" },
      sound: "default",
    })),
  );

  return new Response(JSON.stringify({ ...result, tokens: pushTokens.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
