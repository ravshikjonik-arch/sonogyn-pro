import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getClinicalRole, type ClinicalRole } from "@/lib/security/require-clinical-role";

export function isAuthorRole(role: ClinicalRole | null): boolean {
  return role === "author" || role === "admin";
}

export async function requireAuthorUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; role: ClinicalRole } | { ok: false; response: NextResponse }> {
  const role = await getClinicalRole(supabase, userId);
  if (!role || !isAuthorRole(role)) {
    return { ok: false, response: NextResponse.json({ error: "Доступ только для авторов курсов." }, { status: 403 }) };
  }
  return { ok: true, role };
}

export async function assertCourseAccess(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  role: ClinicalRole,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (role === "admin") return { ok: true };

  const { data, error } = await supabase
    .from("courses")
    .select("author_id")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: NextResponse.json({ error: "Курс не найден." }, { status: 404 }) };
  }
  if (data.author_id !== userId) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}
