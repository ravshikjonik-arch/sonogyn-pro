import { getDevBypassProfile } from "@/lib/auth/dev-account";
import { buildDoctorCabinetLabel, resolveDoctorFullName } from "@/lib/auth/doctor-display";
import { createClient } from "@/utils/supabase/server";

export async function loadDoctorCabinetLabelForSession() {
  const dev = getDevBypassProfile();
  if (dev?.full_name) {
    return buildDoctorCabinetLabel(dev.full_name);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildDoctorCabinetLabel(null);
  }

  const [{ data: profile }, { data: doctor }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const fullName = resolveDoctorFullName({
    profileFullName: doctor?.full_name ?? profile?.full_name,
    userMetadataFullName: meta?.full_name,
    emailFallback: user.email,
  });

  return buildDoctorCabinetLabel(fullName);
}
