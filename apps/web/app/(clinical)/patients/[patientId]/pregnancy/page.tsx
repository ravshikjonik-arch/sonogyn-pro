import Link from "next/link";
import { redirect } from "next/navigation";

import { FetalGrowthChart } from "@/components/patients/FetalGrowthChart";
import { gaDaysFromLmp, screeningHintsRu } from "@repo/medical-calculations";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

type Params = { patientId: string };

export default async function PregnancyPage(props: { params: Promise<Params> }) {
  const { patientId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id,display_label,meta")
    .eq("id", patientId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!patient) redirect("/patients");

  const meta = (patient.meta ?? {}) as { lmp?: string };
  const lmp = meta.lmp ? new Date(meta.lmp) : null;
  const today = new Date();
  const gaDays = lmp ? gaDaysFromLmp(lmp, today) : null;
  const hints = gaDays != null ? screeningHintsRu(gaDays) : [];

  const { data: studies } = await supabase
    .from("studies")
    .select("id")
    .eq("patient_id", patientId);

  const studyIds = (studies ?? []).map((s) => s.id);
  let growthPoints: { week: number; grams: number }[] = [];

  if (studyIds.length > 0) {
    const { data: measurements } = await supabase
      .from("measurements")
      .select("payload,created_at")
      .eq("kind", "ultrasound_protocol")
      .in("study_id", studyIds)
      .order("created_at", { ascending: true })
      .limit(20);

    for (const m of measurements ?? []) {
      const payload = m.payload as { efw_grams?: number; ga_days?: number };
      if (payload.efw_grams && payload.ga_days) {
        growthPoints.push({ week: payload.ga_days / 7, grams: payload.efw_grams });
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="secondary" size="sm">
        <Link href={`/patients/${patientId}`}>← Карта пациента</Link>
      </Button>
      <h1 className="mt-4 text-2xl font-bold">Ведение беременности</h1>
      <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{patient.display_label}</p>

      {gaDays != null ? (
        <p className="mt-4 text-sm">
          Текущий ориентировочный срок: <strong>{Math.floor(gaDays / 7)} нед {gaDays % 7} д</strong>
        </p>
      ) : (
        <p className="mt-4 text-sm text-amber-600">Укажите ПМП в карте пациента для расчёта срока.</p>
      )}

      <section className="mt-8 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
        <h2 className="font-semibold">Кривая роста плода (EFW)</h2>
        <FetalGrowthChart points={growthPoints} />
        {growthPoints.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
            Сохраните протоколы с EFW в исследованиях, чтобы точки появились на графике.
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--clinical-border)] p-4">
        <h2 className="font-semibold">Напоминания о скринингах</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-[var(--clinical-foreground-muted)]">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
