import { NextResponse } from "next/server";

import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

/**
 * Yandex login.yandex.ru/info expects `Authorization: OAuth <token>`,
 * while Supabase Custom OAuth sends `Bearer`. This proxy adapts the header
 * and returns OIDC-shaped claims for Auth user provisioning.
 *
 * Set as UserInfo URL on Supabase Custom Provider `custom:yandex`:
 *   https://sonogyn-pro.ru/api/auth/yandex/userinfo
 */
export async function GET(request: Request) {
  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(request, "yandex-userinfo"),
    RL.authSession.limit,
    RL.authSession.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const auth = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim()) || /^OAuth\s+(.+)$/i.exec(auth.trim());
  const token = match?.[1]?.trim();
  if (!token) {
    return NextResponse.json({ error: "missing_bearer_token" }, { status: 401 });
  }

  const yandexRes = await fetch("https://login.yandex.ru/info?format=json", {
    headers: {
      Accept: "application/json",
      Authorization: `OAuth ${token}`,
    },
    cache: "no-store",
  });

  const rawText = await yandexRes.text();
  if (!yandexRes.ok) {
    return NextResponse.json(
      { error: "yandex_userinfo_failed", status: yandexRes.status },
      { status: yandexRes.status === 401 || yandexRes.status === 403 ? yandexRes.status : 502 },
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "yandex_userinfo_invalid_json" }, { status: 502 });
  }

  const id = typeof raw.id === "string" || typeof raw.id === "number" ? String(raw.id) : "";
  const psuid = typeof raw.psuid === "string" ? raw.psuid : "";
  const sub = id || psuid;
  if (!sub) {
    return NextResponse.json({ error: "yandex_userinfo_missing_sub" }, { status: 502 });
  }

  const email =
    (typeof raw.default_email === "string" && raw.default_email) ||
    (Array.isArray(raw.emails) && typeof raw.emails[0] === "string" ? raw.emails[0] : "") ||
    "";

  const displayName =
    (typeof raw.real_name === "string" && raw.real_name) ||
    (typeof raw.display_name === "string" && raw.display_name) ||
    (typeof raw.login === "string" && raw.login) ||
    "";

  const given = typeof raw.first_name === "string" ? raw.first_name : "";
  const family = typeof raw.last_name === "string" ? raw.last_name : "";

  return NextResponse.json({
    // Keep Yandex originals, then overlay OIDC-shaped claims Supabase expects.
    ...raw,
    sub,
    id: sub,
    email: email || undefined,
    email_verified: Boolean(email),
    name: displayName || undefined,
    preferred_username: typeof raw.login === "string" ? raw.login : undefined,
    given_name: given || undefined,
    family_name: family || undefined,
    picture:
      typeof raw.default_avatar_id === "string" && raw.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${raw.default_avatar_id}/islands-200`
        : undefined,
  });
}
