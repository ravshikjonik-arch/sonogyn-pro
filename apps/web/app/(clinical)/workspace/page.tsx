import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateStudyForm } from "@/components/copilot/CreateStudyForm";
import { createClient } from "@/utils/supabase/server";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: studies, error } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = studies ?? [];

  return (
    <main className="px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            Clinical Copilot · MVP
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Рабочее место УЗИ (PACS-light)
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">
            Загрузка серий кадров с разделением по исследованиям и сериям. Хранилище
            Supabase (приватное), метаданные в Postgres с RLS по пользователю.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <h2 className="text-lg font-bold text-slate-950">Последние исследования</h2>
            {error ? (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Таблицы ещё не созданы или недоступны: выполните SQL-миграцию в Supabase (
                <code className="font-mono text-xs">supabase/migrations/...</code>
                ).
              </p>
            ) : null}

            {!error && rows.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                Пока нет исследований — создайте первое справа.
              </p>
            ) : null}

            <ul className="mt-4 divide-y divide-slate-100">
              {rows.map((study) => (
                <li key={study.id} className="py-3">
                  <Link
                    className="group flex flex-col gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                    href={`/workspace/${study.id}`}
                  >
                    <span className="text-sm font-bold text-slate-950 group-hover:text-blue-700">
                      {study.title ?? "Без названия"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {study.study_type} · {study.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner sm:p-8">
            <h2 className="text-lg font-bold text-slate-950">Новое исследование</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Используйте псевдонимы случаев; PHI загружайте только при юридическом
              разрешении и с включённым шифрованием по политике клиники.
            </p>
            <CreateStudyForm />
          </section>
        </div>
      </div>
    </main>
  );
}
