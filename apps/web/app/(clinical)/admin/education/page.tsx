import { redirect } from "next/navigation";

import { EducationAdminClient } from "@/components/education/EducationAdminClient";
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

  return <EducationAdminClient />;
}
