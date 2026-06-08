import { NextResponse } from "next/server";

import { explainAuthNetworkFailure, isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

export async function POST(req: Request) {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        { error: explainAuthNetworkFailure(error.message) },
        { status: net ? 502 : 401 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: explainAuthNetworkFailure(msg) }, { status: 502 });
  }

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
