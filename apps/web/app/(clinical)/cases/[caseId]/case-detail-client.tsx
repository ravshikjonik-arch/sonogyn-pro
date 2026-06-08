"use client";

import Link from "next/link";

import { CaseMediaGallery } from "@/components/cases/CaseMediaGallery";
import { CasePublishPanel } from "@/components/cases/CasePublishPanel";
import { TeachingCaseDiscussion } from "@/components/cases/teaching-case-discussion";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { useAuth } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export type CaseDetailData = {
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

type Props = {
  teachingCase: CaseDetailData;
  devSkip?: boolean;
};

export function CaseDetailClient({ teachingCase, devSkip = false }: Props) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="px-6 py-16 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>;
  }

  if (!user && !devSkip) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="font-semibold">Нужен вход врача</p>
        <Button className="mt-4" asChild>
          <Link href="/login?redirectedFrom=/cases">Войти</Link>
        </Button>
      </div>
    );
  }

  const assistContext = {
    code: teachingCase.anatomy ?? "CASE",
    title: teachingCase.title,
    group: "Чат врачей · коллегиальный разбор",
    mode: "gynecology" as const,
    ultrasoundFocus: [
      teachingCase.description ?? "Обсуждение снимка с коллегами",
      "Прикрепите фото/видео и используйте ИИ для структуры описания",
    ],
    voiceProfile: "general" as const,
  };

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cases?tab=cases">← Кейсы</Link>
          </Button>
          <Badge variant="outline">{teachingCase.anatomy ?? "УЗИ"}</Badge>
          {user ? (
            <CasePublishPanel
              caseId={teachingCase.id}
              userId={user.id}
              ownerId={teachingCase.user_id}
              status={teachingCase.status}
              isPublic={teachingCase.is_public}
            />
          ) : null}
        </div>

        <article className="sonogyn-glass-card rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{teachingCase.title}</h1>
          <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
            {new Date(teachingCase.created_at).toLocaleString()}
          </p>
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            {teachingCase.pathology ? (
              <p>
                <span className="font-semibold">Патология:</span> {teachingCase.pathology}
              </p>
            ) : null}
            {teachingCase.difficulty ? (
              <p>
                <span className="font-semibold">Сложность:</span> {teachingCase.difficulty}
              </p>
            ) : null}
          </div>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {teachingCase.description ?? "Добавьте клинический вопрос — что хотите обсудить с коллегами."}
          </div>
          {teachingCase.flag_reason ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Флаг модерации: {teachingCase.flag_reason}
            </p>
          ) : null}
        </article>

        {user ? (
          <>
            <CaseMediaGallery
              caseId={teachingCase.id}
              userId={user.id}
              canUpload={user.id === teachingCase.user_id}
            />
            <ClinicalAssistStrip context={assistContext} compact />
            <TeachingCaseDiscussion caseId={teachingCase.id} userId={user.id} />
          </>
        ) : (
          <p className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-4 text-sm text-[var(--clinical-foreground-muted)]">
            Войдите, чтобы загружать снимки и писать в обсуждении.
          </p>
        )}
      </div>
    </div>
  );
}
