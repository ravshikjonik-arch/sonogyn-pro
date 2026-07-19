import { redirect } from "next/navigation";

import {
  MedicalAccessAdminClient,
  type MedicalAccessUserRow,
} from "@/components/admin/MedicalAccessAdminClient";
import { createClient } from "@/utils/supabase/server";

export default async function AdminMedicalAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/medical-access");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }

  const { data } = await supabase
    .from("profiles")
    .select(
      "id,full_name,institution,specialization,role,created_at,medical_access_status,medical_license_number,medical_verified_at,medical_verification_note",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Медицинский допуск
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Проверка врачей, ординаторов и студентов
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Здесь задается медицинский допуск к платформе. Врачебный чат открывается ординаторам,
          врачам, подтвержденным врачам, модераторам и администраторам.
        </p>
      </header>

      <MedicalAccessAdminClient users={((data ?? []) as unknown as MedicalAccessUserRow[])} />
    </div>
  );
}
