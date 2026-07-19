import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  kind: z.enum(["orads", "prolapse"]),
});

const DEMO_CASES = {
  orads: {
    title: "Демо · многокамерная кистозная масса",
    description:
      "54 года, случайная находка слева. Обсудите категорию O-RADS и тактику наблюдения (учебный кейс, без PHI).",
    anatomy: "Adnexa",
    pathology: "Cystic mass",
    difficulty: "intermediate",
    orads_category: 3,
    tags: ["cystic", "adnexa", "o-rads"],
  },
  prolapse: {
    title: "POP-Q Stage II · цистоцеле · разбор",
    description:
      "Постменопауза, жалобы на «шарик», Ba +1 см, TVL 9 см. Обсудите тактику: наблюдение vs операция (учебный кейс, без PHI).",
    anatomy: "Тазовое дно / POP-Q",
    pathology: "POP-Q",
    difficulty: "intermediate",
    orads_category: null,
    tags: ["pop-q", "prolapse"],
  },
} as const;

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "cases-demo-create", RL.casesListIp);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "cases-demo-create", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = DEMO_CASES[parsed.data.kind];
  const { data, error } = await supabase
    .from("cases")
    .insert({
      ...template,
      user_id: auth.userId,
      status: "published",
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    safeLog("case demo create error", { code: error?.code, message: error?.message });
    return NextResponse.json({ error: "Не удалось создать демо-кейс" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
