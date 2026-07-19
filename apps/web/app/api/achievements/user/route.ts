import { NextResponse } from "next/server";

import {
  getUserAchievementsPayload,
  isPrismaConfigured,
} from "@/lib/achievements/engine";
import { createSupabaseRouteHandlerClient, nextJsonWithAuthCookies } from "@/lib/route-handler-supabase";

const DISABLED_PAYLOAD = {
  progress: {
    totalXp: 0,
    level: 1,
    streakDays: 0,
    xpInCurrentLevel: 0,
    xpToNextLevel: 100,
    xpProgressPercent: 0,
  },
  achievements: [],
  stats: {
    casesByModule: {},
    lessonsCompleted: 0,
    fmfCompleted: 0,
    fmfTotal: 0,
  },
  disabled: true,
};

export async function GET() {
  if (!isPrismaConfigured()) {
    return NextResponse.json(DISABLED_PAYLOAD);
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
