import { NextResponse } from "next/server";

import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type UpdatePasswordBody = {
  password?: string;
};

/** Смена пароля после recovery-link — сессия только в HttpOnly cookies. */
export async function POST(request: Request) {
  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(request, "auth-update-password"),
    RL.authSignIn.limit,
    RL.authSignIn.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: UpdatePasswordBody;
  try {
    body = (await request.json()) as UpdatePasswordBody;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "Пароль не короче 8 символов." }, { status: 400 });
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Сессия восстановления не найдена. Запросите новую ссылку из письма." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.auth.signOut();

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
