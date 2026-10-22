import { redirect } from "next/navigation";

import { VerifyDoctorClient } from "@/components/verify/VerifyDoctorClient";
import type { DoctorVerificationRow } from "@/lib/trust/verification-schemas";
import { createClient } from "@/utils/supabase/server";

export default async function VerifyDoctorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/verify");
  }

  const [{ data: profile }, { data: doctor }, { data: verifications }] = await Promise.all([
    supabase.from("profiles").select("full_name,is_verified,specialization").eq("id", user.id).maybeSingle(),
    supabase.from("users").select("full_name,specialization").eq("id", user.id).maybeSingle(),
    supabase
      .from("doctor_verifications")
      .select(
        "id,user_id,status,full_name,birth_date,specialization,diploma_number,diploma_file_path,org_name,submitted_at,reviewed_at,rejection_reason",
      )
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1),
  ]);

  const latest = (verifications?.[0] ?? null) as DoctorVerificationRow | null;
  const defaultFullName =
    doctor?.full_name?.trim() || profile?.full_name?.trim() || user.email?.split("@")[0] || "";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--clinical-foreground-muted)]">
          Доверие и безопасность
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Подтверждение статуса врача
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          После проверки в чате и в ленте кейсов рядом с вашим именем появится значок ✓. Это не
          заменяет медицинскую лицензию и не является юридическим заключением.
        </p>
      </header>

      <VerifyDoctorClient
        initialVerification={latest}
        profileVerified={Boolean(profile?.is_verified)}
        defaultFullName={defaultFullName}
        defaultSpecialization={doctor?.specialization ?? profile?.specialization ?? null}
      />
    </div>
  );
}
