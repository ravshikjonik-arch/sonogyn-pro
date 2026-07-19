import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  status: z.enum(["online", "offline"]),
});

export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-presence-list", RL.casesListIp);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-presence-list", RL.casesListUser);
  if (userRl) return userRl;

  const { data, error } = await supabase
    .from("doctor_presence")
    .select("user_id,display_name,status,last_seen_at,updated_at")
    .order("last_seen_at", { ascending: false });

  if (error) {
    safeLog("doctor presence list error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось загрузить presence" }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-presence-write", RL.authSession);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-presence-write", RL.authSession);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email")
    .eq("id", auth.userId)
    .maybeSingle();

  const displayName =
    (typeof profile?.full_name === "string" && profile.full_name.trim()) ||
    (typeof profile?.email === "string" && profile.email.split("@")[0]) ||
    auth.email?.split("@")[0] ||
    "Врач";

  const now = new Date().toISOString();
  const { error } = await supabase.from("doctor_presence").upsert(
    {
      user_id: auth.userId,
      display_name: displayName,
      status: parsed.data.status,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    safeLog("doctor presence write error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось обновить presence" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
