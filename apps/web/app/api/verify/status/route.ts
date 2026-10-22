import { NextResponse } from "next/server";

import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("is_verified").eq("id", auth.userId).maybeSingle(),
    supabase
      .from("doctor_verifications")
      .select(
        "id,user_id,status,full_name,birth_date,specialization,diploma_number,diploma_file_path,org_name,submitted_at,reviewed_at,rejection_reason",
      )
      .eq("user_id", auth.userId)
      .order("submitted_at", { ascending: false })
      .limit(1),
  ]);

  return NextResponse.json({
    is_verified: Boolean(profile?.is_verified),
    verification: rows?.[0] ?? null,
  });
}
