import Link from "next/link";
import { redirect } from "next/navigation";

import {
  RegulationIngestAdminClient,
  type RegulationExtractionRow,
  type RegulationQueueRow,
} from "@/components/admin/RegulationIngestAdminClient";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Регуляторика · review — SonoGyn Pro",
  description: "Очередь приказов и КР: мониторинг, AI-извлечение, медицинский review.",
};

export default async function AdminRegulationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/admin/regulations");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/app");

  const { data: queueRaw, error: queueError } = await supabase
    .from("regulation_ingest_queue")
    .select("id, source, title, source_url, status, fetched_at, raw_snippet")
    .order("fetched_at", { ascending: false })
    .limit(40);

  if (queueError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-red-600">
          Таблица regulation_ingest_queue недоступна. Примените миграцию{" "}
          <code className="text-xs">20261022120000_regulation_ingest.sql</code> на Supabase.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin">← Admin</Link>
        </Button>
      </div>
    );
  }

  const queue = (queueRaw ?? []) as RegulationQueueRow[];
  const ids = queue.map((q) => q.id);

  let extractions: RegulationExtractionRow[] = [];
  if (ids.length > 0) {
    const { data: exRaw } = await supabase
      .from("regulation_extractions")
      .select("id, queue_id, extracted_json, model, confidence, reviewed_at, created_at")
      .in("queue_id", ids)
      .order("created_at", { ascending: false });
    extractions = (exRaw ?? []) as RegulationExtractionRow[];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--clinical-foreground-muted)]">
          Admin · регуляторика
        </p>
        <h1 className="text-2xl font-black tracking-tight">Приказы и КР — review pipeline</h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Level 1: cron <code className="text-xs">/api/cron/ingest-rf-regulations</code> (2×/нед). Level 2:
          AI-структура. Level 3: после «Одобрить» — ручной merge в{" "}
          <code className="text-xs">@repo/clinical-guidelines</code>.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">← Dashboard</Link>
        </Button>
      </header>

      <RegulationIngestAdminClient initialQueue={queue} initialExtractions={extractions} />
    </div>
  );
}
