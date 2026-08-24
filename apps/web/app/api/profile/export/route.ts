import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

/**
 * Выгрузка своих данных аккаунта (152-ФЗ): профиль + сводка пациентов, без сырого PHI dump всех исследований.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `profile-export:${auth.userId}`,
    RL.profileExport.limit,
    RL.profileExport.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов. Подождите." }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, institution, specialization, birth_year, role, subscription_tier, created_at, updated_at",
    )
    .eq("id", auth.userId)
    .maybeSingle();

  const { count: patientsCount } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("created_by", auth.userId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    exported_at: new Date().toISOString(),
    subject: {
      user_id: auth.userId,
      email: auth.email ?? user?.email ?? null,
      phone: user?.phone ?? null,
    },
    profile: profile ?? null,
    patients: {
      count: patientsCount ?? 0,
      note: "Полный список пациентов доступен в кабинете /patients при авторизации.",
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sonogyn-data-export-${auth.userId.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
