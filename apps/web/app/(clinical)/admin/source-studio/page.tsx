import Link from "next/link";
import { redirect } from "next/navigation";

import { SourceStudioClient } from "@/components/admin/SourceStudioClient";
import { requireClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Source Studio — SonoGyn Pro",
  description: "Закрытая редакция медицинских источников (admin/author).",
};

export default async function SourceStudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/admin/source-studio");

  const gate = await requireClinicalRole(supabase, user.id, "author");
  if (!gate.ok) redirect("/home");

  const { data: sources } = await supabase
    .from("sources")
    .select("id,title,review_status,source_type,updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Source Studio · admin/author
        </p>
        <h1 className="mt-2 text-3xl font-bold">Закрытая библиотека источников</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Text ingest → sanitize → chunks → review → publish. PDF/OCR — отдельный этап. Врачи не видят
          PDF, только RAG/карточки после publish.
        </p>
      </header>

      <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm" role="status">
        <p>
          <strong>Сейчас:</strong> текстовый ingest и publish в UI.{" "}
          <strong>Нет:</strong> загрузка PDF/сканов и авто-OCR. Книги без license_notes — не загружать.
        </p>
      </section>

      <SourceStudioClient initialSources={sources ?? []} />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 text-sm hover:bg-[var(--clinical-muted)]"
        >
          ← Admin
        </Link>
        <Link
          href="/tools/refs/evidence-assistant"
          className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 text-sm hover:bg-[var(--clinical-muted)]"
        >
          Evidence Assistant
        </Link>
      </div>
    </div>
  );
}
