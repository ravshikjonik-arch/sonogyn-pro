import { createClient } from "@/utils/supabase/server";

import { countUserCourseEnrollments } from "@/lib/career/enrollments";
import { buildCareerProgress, type CareerProfileInput } from "@/lib/career/resolve-stage";

export async function loadCareerProgressForSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false as const, progress: buildCareerProgress(null, false) };
  }

  const [{ data: profile }, courseEnrollmentCount] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, specialization, birth_year, subscription_tier, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle(),
    countUserCourseEnrollments(supabase, user.id),
  ]);

  const input: CareerProfileInput = {
    full_name: profile?.full_name ?? null,
    specialization: profile?.specialization ?? null,
    birth_year: profile?.birth_year ?? null,
    subscription_tier: profile?.subscription_tier ?? "free",
    trial_ends_at: profile?.trial_ends_at ?? null,
    courseEnrollmentCount,
  };

  return {
    isAuthenticated: true as const,
    progress: buildCareerProgress(input, true),
  };
}
