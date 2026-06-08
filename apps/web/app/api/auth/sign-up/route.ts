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
  const full_name =
    typeof body === "object" && body !== null && "full_name" in body
      ? String((body as { full_name: unknown }).full_name).trim()
      : "";
  const specialization =
    typeof body === "object" && body !== null && "specialization" in body
      ? String((body as { specialization: unknown }).specialization).trim()
      : "";
  const institution =
    typeof body === "object" && body !== null && "institution" in body
      ? String((body as { institution: unknown }).institution).trim()
      : "";
  const preferred_locale =
    typeof body === "object" && body !== null && "preferred_locale" in body
      ? String((body as { preferred_locale: unknown }).preferred_locale).trim()
      : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  if (!full_name) {
    return NextResponse.json({ error: "Укажите имя и фамилию (полное имя специалиста)." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          ...(specialization ? { specialization } : {}),
          ...(institution ? { institution } : {}),
          ...(preferred_locale ? { preferred_locale } : {}),
        },
      },
    });

    if (error) {
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        { error: explainAuthNetworkFailure(error.message) },
        { status: net ? 502 : 400 },
      );
    }

    return nextJsonWithAuthCookies(
      {
        ok: true,
        needsEmailConfirmation: !data.session,
      },
      cookiesToSet,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: explainAuthNetworkFailure(msg) }, { status: 502 });
  }
}
