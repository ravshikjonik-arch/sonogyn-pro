import { NextResponse } from "next/server";

import { checkAndAwardAchievements, isPrismaConfigured } from "@/lib/achievements/engine";
import {
  AchievementCheckBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { createSupabaseRouteHandlerClient, nextJsonWithAuthCookies } from "@/lib/route-handler-supabase";

const DISABLED_RESULT = {
  newlyUnlocked: [],
  progress: {
    totalXp: 0,
    level: 1,
    streakDays: 0,
    xpInCurrentLevel: 0,
    xpToNextLevel: 100,
    xpProgressPercent: 0,
  },
  stats: {
    casesByModule: {},
    lessonsCompleted: 0,
    fmfCompleted: 0,
    fmfTotal: 0,
  },
};

/** Вызывается после кейса, теста, урока или входа — проверяет новые бейджи */
export async function POST(req: Request) {
  if (!isPrismaConfigured()) {
    return NextResponse.json({ ...DISABLED_RESULT, disabled: true });
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
