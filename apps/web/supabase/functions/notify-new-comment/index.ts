import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createServiceClient, sendExpoPushBatch } from "../_shared/expo-push.ts";

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

function verifyWebhook(req: Request): boolean {
  const secret = Deno.env.get("DISCUSSIONS_WEBHOOK_SECRET")?.trim();
  if (!secret) return Deno.env.get("DENO_ENV") !== "production";
  return req.headers.get("x-webhook-secret") === secret;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyWebhook(req)) {
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

  const { url, key } = createServiceClient();
  const supabase = createClient(url, key);

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
