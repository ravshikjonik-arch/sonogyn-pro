/** Expo Push API batch sender (Supabase Edge Functions / Deno). */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
};

export async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      failed += chunk.length;
      continue;
    }

    const json = (await res.json()) as { data?: { status?: string }[] };
    for (const item of json.data ?? []) {
      if (item.status === "ok") sent += 1;
      else failed += 1;
    }
  }

  return { sent, failed };
}

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return { url, key };
}

export function createServiceSupabase(): SupabaseClient {
  const { url, key } = createServiceClient();
  return createClient(url, key);
}

/** Env secret first; fallback to DB RPC (prod webhooks without CLI secrets). */
export async function verifyDiscussionWebhook(
  req: Request,
  supabase: SupabaseClient,
): Promise<boolean> {
  const header = req.headers.get("x-webhook-secret")?.trim();
  if (!header) return false;

  const envSecret = Deno.env.get("DISCUSSIONS_WEBHOOK_SECRET")?.trim();
  if (envSecret) return header === envSecret;

  const { data, error } = await supabase.rpc("verify_discussion_webhook_secret", {
    p_secret: header,
  });
  return !error && data === true;
}

/**
 * Filter recipients by profiles.clinical_preferences.notifications.messagesEnabled.
 * Default (missing / true) = allow; only explicit false opts out.
 */
export async function filterUsersWithMessageNotifications(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<{ allowed: string[]; suppressed: number }> {
  if (userIds.length === 0) return { allowed: [], suppressed: 0 };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, clinical_preferences")
    .in("id", userIds);

  if (error) {
    console.warn("[push] clinical_preferences filter failed — allow all", error.message);
    return { allowed: userIds, suppressed: 0 };
  }

  const disabled = new Set<string>();
  for (const row of data ?? []) {
    const prefs = row.clinical_preferences as
      | { notifications?: { messagesEnabled?: boolean } }
      | null;
    if (prefs?.notifications?.messagesEnabled === false) {
      disabled.add(row.id as string);
    }
  }

  const allowed = userIds.filter((id) => !disabled.has(id));
  return { allowed, suppressed: userIds.length - allowed.length };
}
