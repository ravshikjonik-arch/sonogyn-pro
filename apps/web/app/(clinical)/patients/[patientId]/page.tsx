import Link from "next/link";
import { redirect } from "next/navigation";

import { PatientAiSummary } from "@/components/patients/PatientAiSummary";
import { PatientForm } from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

type Params = { patientId: string };

export default async function PatientDetailPage(props: { params: Promise<Params> }) {
  const { patientId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .eq("id", patientId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!patient) {
    return (
      <main className="px-4 py-10">
        <p className="text-sm">Пациент не найден.</p>
        <Link href="/profile/patients" className="mt-4 inline-block text-blue-600">
          ← К списку
        </Link>
      </main>
    );
  }

  const { data: studies } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at")
    .eq("patient_id", patientId)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const latestStudyId = studies?.[0]?.id;
  const cpiHref =
    latestStudyId != null
      ? `/tools/calc/gyn/cervical-intelligence?patientId=${patientId}&studyId=${latestStudyId}`
      : `/tools/calc/gyn/cervical-intelligence?patientId=${patientId}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link href="/profile/patients">← Пациенты</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/profile/patients/${patientId}/pregnancy`}>Беременность / графики</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/workspace?patientId=${patientId}`}>Новое исследование</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/ai/consultants/gynecology?patientId=${patientId}`}>Помощник → протокол</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={cpiHref}>CPI — кольпоскопия</Link>
        </Button>
      </div>

      <div className="mb-8">
        <PatientAiSummary
          meta={(patient.meta ?? {}) as { date_of_birth?: string | null; lmp?: string | null }}
          studiesCount={(studies ?? []).length}
        />
      </div>

      <PatientForm
        patientId={patientId}
        initial={{
          display_label: patient.display_label,
          external_ref: patient.external_ref,
          meta: (patient.meta ?? {}) as Record<string, string>,
        }}
      />

      {(() => {
        const meta = (patient.meta ?? {}) as { assistant_protocol_draft?: string };
        const draft = meta.assistant_protocol_draft?.trim();
        if (!draft) return null;
        return (
          <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h2 className="text-sm font-black text-emerald-900">Черновик маршрута помощника</h2>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-emerald-950">{draft.slice(0, 800)}{draft.length > 800 ? "…" : ""}</p>
            <p className="mt-2 text-xs text-emerald-800">
              При следующем исследовании сохраните снова из помощника — попадёт в протокол УЗИ.
            </p>
          </section>
        );
      })()}

      <section className="mt-10">
        <h2 className="text-lg font-bold">История визитов / исследований</h2>
        {(studies ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">Исследований пока нет.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(studies ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-stretch gap-2">
                <Link
                  href={`/workspace/${s.id}`}
                  className="block min-w-0 flex-1 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-3 hover:bg-[var(--clinical-muted)]"
                >
                  <span className="font-medium">{s.title ?? s.study_type}</span>
                  <span className="ml-2 text-xs text-[var(--clinical-foreground-muted)]">
                    {new Date(s.created_at).toLocaleString("ru-RU")}
                  </span>
                </Link>
                <Button asChild variant="outline" size="sm" className="shrink-0 self-center">
                  <Link
                    href={`/tools/calc/gyn/cervical-intelligence?patientId=${patientId}&studyId=${s.id}`}
                  >
                    CPI
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
