"use client";

import Link from "next/link";

import { CaseAiAnalysisPanel } from "@/components/cases/CaseAiAnalysisPanel";
import { StructuredCaseEditor } from "@/components/structured-editor/StructuredCaseEditor";
import { CaseEditorialPanel } from "@/components/cases/CaseEditorialPanel";
import { CaseLifecyclePanel } from "@/components/cases/CaseLifecyclePanel";
import { CaseMediaGallery } from "@/components/cases/CaseMediaGallery";
import { CasePublishPanel } from "@/components/cases/CasePublishPanel";
import { TeachingCaseDiscussion } from "@/components/cases/teaching-case-discussion";
import { ModuleProgressWidget } from "@/components/achievements/ModuleProgressWidget";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { reportAchievementCheck } from "@/hooks/useAchievements";
import type { ClinicalModuleId } from "@/lib/achievements/types";
import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import { useAuth } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFullOpenAccessEnabledClient } from "@/lib/auth/guest-demo-account";
export type CaseDetailData = {
  id: string;
  title: string;
  description: string | null;
  description_html?: string | null;
  anatomy: string | null;
  pathology: string | null;
  difficulty: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
  flag_reason: string | null;
  channel_id: string | null;
  lifecycle_status?: string | null;
  is_rare?: boolean;
  rare_slot?: string | null;
  editorial_priority?: number | null;
};

type Props = {
  teachingCase: CaseDetailData;
  channelTitle?: string | null;
  openedFromPush?: boolean;
  devSkip?: boolean;
  isModerator?: boolean;
  isExpert?: boolean;
};

function caseModuleId(anatomy: string | null, pathology: string | null): ClinicalModuleId {
  const hay = `${anatomy ?? ""} ${pathology ?? ""}`.toLowerCase();
  if (hay.includes("iota")) return "iota";
  if (hay.includes("o-rads") || hay.includes("orads")) return "orads";
  if (hay.includes("bi-rads") || hay.includes("birads")) return "birads";
  if (hay.includes("ti-rads") || hay.includes("tirads")) return "tirads";
  if (hay.includes("fmf")) return "fmf";
  return "orads";
}

export function CaseDetailClient({
  teachingCase,
  channelTitle = null,
  openedFromPush = false,
  devSkip = false,
  isModerator = false,
  isExpert = false,
}: Props) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="px-6 py-16 text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p>;
  }

  const openAccess = isFullOpenAccessEnabledClient();

  if (!user && !devSkip && !openAccess) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="font-semibold">Нужен вход врача</p>
        <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">
          ИИ-разбор и чат — после входа по email. Калькуляторы доступны без регистрации.
        </p>
        <Button className="mt-4" asChild>
          <Link
            href={`/login?redirectedFrom=${encodeURIComponent(`/cases/${teachingCase.id}`)}`}
          >
            Войти по email
          </Link>
        </Button>
      </div>
    );
  }

  if (!user && !devSkip && openAccess) {
    return <p className="px-6 py-16 text-sm text-[var(--clinical-foreground-muted)]">Подключаем демо-сессию…</p>;
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

  const isDiscussion = Boolean(teachingCase.channel_id);
  const caseModule = caseModuleId(teachingCase.anatomy, teachingCase.pathology);
  const casesBackHref = isDiscussion
    ? `/cases?feedMode=discussions${
        teachingCase.channel_id ? `&channelId=${encodeURIComponent(teachingCase.channel_id)}` : ""
      }`
    : "/cases?tab=cases";

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        {openedFromPush ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Открыто из push-уведомления — ответьте коллеге в обсуждении ниже.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={casesBackHref}>← {isDiscussion ? "Вопросы коллегам" : "Кейсы"}</Link>
          </Button>
          {isDiscussion ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900">
              Вопрос коллегам{channelTitle ? ` · ${channelTitle}` : ""}
            </Badge>
          ) : null}
          {user ? (
            <CaseLifecyclePanel
              caseId={teachingCase.id}
              userId={user.id}
              ownerId={teachingCase.user_id}
              status={teachingCase.status}
              lifecycleStatus={teachingCase.lifecycle_status}
              confirmedDiagnosis={teachingCase.confirmed_diagnosis}
              knowledgeBaseAt={teachingCase.knowledge_base_at}
              isModerator={isModerator}
              isExpert={isExpert}
            />
          ) : null}
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
          {teachingCase.description_html?.trim() ? (
            <div
              className="prose prose-sm mt-6 max-w-none leading-relaxed text-[var(--clinical-foreground-muted)] dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: sanitizeClinicalHtml(teachingCase.description_html),
              }}
            />
          ) : (
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              {teachingCase.description ?? "Добавьте клинический вопрос — что хотите обсудить с коллегами."}
            </div>
          )}
          {teachingCase.flag_reason ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Флаг модерации: {teachingCase.flag_reason}
            </p>
          ) : null}
        </article>

        {user ? (
          <StructuredCaseEditor
            caseId={teachingCase.id}
            caseTitle={teachingCase.title}
            canEdit={user.id === teachingCase.user_id}
          />
        ) : null}

        {user ? (
          <>
            {isModerator ? (
              <CaseEditorialPanel
                caseId={teachingCase.id}
                isRare={Boolean(teachingCase.is_rare)}
                rareSlot={teachingCase.rare_slot ?? null}
                editorialPriority={teachingCase.editorial_priority ?? 0}
              />
            ) : null}
            <CaseMediaGallery
              caseId={teachingCase.id}
              userId={user.id}
              canUpload={user.id === teachingCase.user_id}
            />
            <CaseAiAnalysisPanel caseId={teachingCase.id} canAnalyze={user.id === teachingCase.user_id} />
            <ClinicalAssistStrip context={assistContext} compact />
            <TeachingCaseDiscussion
              caseId={teachingCase.id}
              userId={user.id}
              caseAuthorId={teachingCase.user_id}
              isExpert={isExpert}
              isModerator={isModerator}
            />
            <ModuleProgressWidget moduleId={caseModule} eventType="case_complete" />
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl"
              onClick={() =>
                void reportAchievementCheck({ eventType: "case_complete", moduleId: caseModule })
              }
            >
              Отметить кейс пройденным (+XP)
            </Button>
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
