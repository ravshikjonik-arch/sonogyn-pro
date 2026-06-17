import { redirect } from "next/navigation";

import { EducationAdminClient } from "@/components/education/EducationAdminClient";
import { educationRegistrationFromRow } from "@/lib/education/registrations";
import { loadTrainingSessions } from "@/lib/education/session-store";
import { createClient } from "@/utils/supabase/server";

export default async function AdminEducationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/education");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }

  const { data: registrationRows, error: registrationsError } = await supabase
    .from("education_registrations")
    .select(
      "id,session_id,session_title,user_id,full_name,email,question,preferred_subtitle_language,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const sessionsResult = await loadTrainingSessions(supabase);

  return (
    <EducationAdminClient
      initialSessions={sessionsResult.sessions}
      sessionsSource={sessionsResult.source}
      sessionsError={sessionsResult.error}
      initialRegistrations={(registrationRows ?? []).map((row) => educationRegistrationFromRow(row))}
      registrationsError={registrationsError?.message ?? null}
    />
  );
}
