import { NextResponse } from "next/server";

import {
  getUserAchievementsPayload,
  isPrismaConfigured,
} from "@/lib/achievements/engine";
import { createSupabaseRouteHandlerClient, nextJsonWithAuthCookies } from "@/lib/route-handler-supabase";

export async function GET() {
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

  try {
    const payload = await getUserAchievementsPayload(user.id);
    return nextJsonWithAuthCookies(payload, client.cookiesToSet);
  } catch (err) {
    console.error("[achievements/user]", err);
    return NextResponse.json({ error: "Не удалось загрузить награды." }, { status: 500 });
  }
}
