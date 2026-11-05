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
          Редакторский контур Medical Source Vault. Врачи в кабинете видят только структурированные
          ответы и карточки источников — не PDF.
        </p>
      </header>

      <section
        className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm"
        role="status"
      >
        <h2 className="font-semibold text-[var(--clinical-foreground)]">Статус сейчас (честно)</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
          <li>
            Есть: схема Supabase (sources / chunks / reviews), list источников ниже, fixtures и live
            Evidence Assistant (PubMed и др.).
          </li>
          <li>
            <strong className="font-semibold text-[var(--clinical-foreground)]">Нет:</strong>{" "}
            upload в UI, автоматический OCR/extract→chunk, кнопка «опубликовать в RAG».
          </li>
          <li>
            Целевой конвейер (после GO): Upload → extract → sanitize → medical review → canonical →
            RAG.
          </li>
        </ul>
        <p className="mt-4 text-xs text-amber-900 dark:text-amber-100">
          Реальные книги и атласы не загружать, пока не заполнены license_notes и нет юр. OK. См.{" "}
          <code className="font-mono">docs/audit/MEDICAL_KNOWLEDGE_BASE_AUDIT.md</code>.
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
            Пусто или таблицы vault ещё не на этом Supabase-проекте. Migration:{" "}
            <code className="font-mono">20260824180000_medical_source_vault.sql</code>. До данных
            работают in-memory fixtures / live Evidence.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="rounded-xl border border-[var(--clinical-border)] px-4 py-2 text-sm hover:bg-[var(--clinical-muted)]"
        >
          ← Admin
        </Link>
        <Link
          href="/tools/refs/medical-knowledge"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Preview: как увидит врач
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
