import { NextResponse } from "next/server";

import { WebPushSubscriptionBodySchema } from "@repo/types";

import { isDoctorChatWebPushEnabled } from "@/lib/chat/flags";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

/** Persist browser Push subscription (doctor chat PWA). */
export async function POST(request: Request) {
  if (!isDoctorChatWebPushEnabled()) {
    return NextResponse.json({ error: "Web push disabled" }, { status: 404 });
  }

  const limited = await rejectIfRateLimitedPreset(request, "web-push-subscribe", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "web-push-subscribe", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = WebPushSubscriptionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { error } = await supabase.from("web_push_subscriptions").upsert(
    {
      user_id: auth.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth_key: parsed.data.keys.auth,
      user_agent: ua,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    safeLog("web push subscribe", { code: error.code });
    return NextResponse.json({ error: "Не удалось сохранить подписку" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Public config for client subscribe (no secrets). */
export async function GET() {
  const enabled = isDoctorChatWebPushEnabled();
  const vapidPublicKey =
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    null;

  return NextResponse.json(
    {
      enabled: enabled && Boolean(vapidPublicKey),
      vapidPublicKey: enabled ? vapidPublicKey : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
