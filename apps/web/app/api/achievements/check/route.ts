import { NextResponse } from "next/server";

import { checkAndAwardAchievements, isPrismaConfigured } from "@/lib/achievements/engine";
import {
  AchievementCheckBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { createSupabaseRouteHandlerClient, nextJsonWithAuthCookies } from "@/lib/route-handler-supabase";

/** Вызывается после кейса, теста, урока или входа — проверяет новые бейджи */
export async function POST(req: Request) {
  if (!isPrismaConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL не настроен — геймификация недоступна." },
      { status: 503 },
    );
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const body = AchievementCheckBodySchema.safeParse(parsed.data);
  if (!body.success) return zodErrorResponse(body.error);

  try {
    const result = await checkAndAwardAchievements(user.id, body.data);
    return nextJsonWithAuthCookies(result, client.cookiesToSet);
  } catch (err) {
    console.error("[achievements/check]", err);
    return NextResponse.json({ error: "Ошибка проверки наград." }, { status: 500 });
  }
}
