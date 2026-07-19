import Link from "next/link";
import { redirect } from "next/navigation";

import { DoctorsCommunityHub } from "@/components/chat/DoctorsCommunityHub";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

type MedicalAccessStatus =
  | "pending"
  | "student"
  | "resident"
  | "doctor"
  | "verified_doctor"
  | "suspended";

const COMMUNITY_STATUSES = new Set<MedicalAccessStatus>([
  "resident",
  "doctor",
  "verified_doctor",
]);

const STATUS_LABEL: Record<MedicalAccessStatus, string> = {
  pending: "заявка ожидает проверки",
  student: "студент",
  resident: "ординатор",
  doctor: "врач",
  verified_doctor: "подтвержденный врач",
  suspended: "доступ приостановлен",
};

type ProfileAccessRow = {
  role: string | null;
  full_name: string | null;
  medical_access_status: MedicalAccessStatus | null;
};

function DoctorCommunityAccessPending({
  profile,
}: {
  profile: ProfileAccessRow | null;
}) {
  const status = profile?.medical_access_status ?? "pending";

  return (
    <div className="min-h-screen bg-[var(--clinical-bg)] px-4 py-12 lg:px-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--clinical-foreground-muted)]">
          Доступ к сообществу
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Чат врачей доступен после медицинской проверки
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          SonoGyn Pro — закрытая клиническая платформа. Врачебный чат, разборы кейсов и медиа доступны
          ординаторам, врачам и подтвержденным врачам. Образовательные разделы и инструменты можно развивать
          отдельно для студентов.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/45 p-4">
          <p className="text-sm font-bold text-[var(--clinical-foreground)]">
            Текущий статус: {STATUS_LABEL[status]}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            Если вы врач или ординатор, заполните профиль: ФИО, специализацию, учреждение и данные для
            подтверждения. После проверки администратор откроет врачебное сообщество.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/profile">Заполнить профиль</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app">В рабочий кабинет</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default async function CasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/cases");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, medical_access_status")
    .eq("id", user.id)
    .maybeSingle<ProfileAccessRow>();

  const role = profile?.role ?? "user";
  const status = profile?.medical_access_status ?? "pending";
  const isStaff = role === "admin" || role === "moderator";
  const canEnterCommunity = isStaff || COMMUNITY_STATUSES.has(status);

  if (!canEnterCommunity) {
    return <DoctorCommunityAccessPending profile={profile ?? null} />;
  }

  return <DoctorsCommunityHub />;
}
