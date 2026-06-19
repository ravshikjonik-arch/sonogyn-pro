import { NextResponse } from "next/server";

import { countUserCourseEnrollments } from "@/lib/career/enrollments";
import { buildCareerProgress, type CareerProfileInput } from "@/lib/career/resolve-stage";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

export async function GET() {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, progress: buildCareerProgress(null, false) });
  }

  const [{ data: profile }, courseEnrollmentCount] = await Promise.all([
    client.supabase
      .from("profiles")
      .select("full_name, specialization, birth_year, subscription_tier, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle(),
    countUserCourseEnrollments(client.supabase, user.id),
  ]);

  const input: CareerProfileInput = {
    full_name: profile?.full_name ?? null,
    specialization: profile?.specialization ?? null,
    birth_year: profile?.birth_year ?? null,
    subscription_tier: profile?.subscription_tier ?? "free",
    trial_ends_at: profile?.trial_ends_at ?? null,
    courseEnrollmentCount,
  };

  return NextResponse.json({ ok: true, progress: buildCareerProgress(input, true) });
}
