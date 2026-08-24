import Link from "next/link";
import { redirect } from "next/navigation";

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
    .limit(20);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Source Studio · admin/author
        </p>
        <h1 className="mt-2 text-3xl font-bold">Закрытая библиотека источников</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Upload → extraction → sanitization → medical review → canonical knowledge → RAG. Врачи
          видят только структурированные ответы и SourceCard, не PDF.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-[var(--clinical-border)] p-6 text-sm">
        <h2 className="font-semibold">Pipeline (MVP)</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
          <li>Загрузка в private bucket <code className="font-mono">medical-source-vault</code></li>
          <li>Text extraction + semantic chunking (review_required)</li>
          <li>sanitizeMedicalSource() — PHI + prompt injection markers</li>
          <li>Medical review → published canonical article</li>
          <li>Clinical RAG через /api/medical-knowledge/retrieve</li>
        </ol>
        <p className="mt-4 text-xs text-amber-800 dark:text-amber-200">
          Сейчас: SQL migration + test fixtures. Реальные книги не загружать до юридической проверки
          license_notes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Sources (editor view)</h2>
        <ul className="mt-4 space-y-2">
          {(sources ?? []).map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--clinical-border)] px-4 py-3 text-sm"
            >
              <span className="font-medium">{s.title}</span>
              <span className="text-xs text-[var(--clinical-foreground-muted)]">
                {s.source_type} · {s.review_status}
              </span>
            </li>
          ))}
        </ul>
        {(sources ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-[var(--clinical-foreground-muted)]">
            Таблицы vault ещё не применены на Supabase — примените migration{" "}
            <code className="font-mono">20260824180000_medical_source_vault.sql</code>. До этого
            работают in-memory fixtures.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/tools/refs/medical-knowledge"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Preview: как увидит врач
        </Link>
        <Link
          href="/tools/refs/clinical-guide/endometrioma-demo"
          className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 text-sm hover:bg-[var(--clinical-muted)]"
        >
          Demo ClinicalGuide
        </Link>
      </div>
    </div>
  );
}
