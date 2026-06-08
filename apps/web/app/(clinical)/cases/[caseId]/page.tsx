import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeachingCaseDiscussion } from "@/components/cases/teaching-case-discussion";
import { createClient } from "@/utils/supabase/server";

type Params = { caseId: string };

export default async function CaseDetailPage(props: { params: Promise<Params> }) {
  const { caseId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: row, error } = await supabase
    .from("cases")
    .select(
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason",
    )
    .eq("id", caseId)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const teachingCase = row as {
    id: string;
    title: string;
    description: string | null;
    anatomy: string | null;
    pathology: string | null;
    difficulty: string | null;
    status: string;
    is_public: boolean;
    created_at: string;
    user_id: string;
    flag_reason: string | null;
  };

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cases">← К ленте</Link>
          </Button>
          <Badge variant="outline">{teachingCase.anatomy ?? "узи"}</Badge>
          <Badge variant="outline">{teachingCase.status}</Badge>
          {teachingCase.is_public ? <Badge variant="outline">публичный</Badge> : null}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{teachingCase.title}</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">ID · {teachingCase.id}</p>
          <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            {teachingCase.pathology ? (
              <p>
                <span className="font-semibold text-slate-900">Патология:</span> {teachingCase.pathology}
              </p>
            ) : null}
            {teachingCase.difficulty ? (
              <p>
                <span className="font-semibold text-slate-900">Сложность:</span> {teachingCase.difficulty}
              </p>
            ) : null}
          </div>
          <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {teachingCase.description ?? "Описание пока пустое — дополните карточку перед публикацией."}
          </div>
          {teachingCase.flag_reason ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Флаг модерации: {teachingCase.flag_reason}
            </p>
          ) : null}
        </article>

        <TeachingCaseDiscussion caseId={teachingCase.id} userId={user.id} />
      </div>
    </div>
  );
}
