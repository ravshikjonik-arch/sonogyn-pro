import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Languages,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrainingRegistrationPanel } from "@/components/education/TrainingRegistrationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatTrainingDateRu,
  getTrainingSessionById,
  TRAINING_LANGUAGE_LABELS,
  TRAINING_SESSIONS,
} from "@/lib/education/live-learning";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export function generateStaticParams() {
  return TRAINING_SESSIONS.map((session) => ({ sessionId: session.id }));
}

export default async function EducationSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const session = getTrainingSessionById(sessionId);
  if (!session) notFound();

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/education">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К расписанию
          </Link>
        </Button>

        <header className="sonogyn-glass-card sonogyn-hero-orbs relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--clinical-primary)]/10 via-transparent to-amber-400/10" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[var(--clinical-primary)]">Обучение</Badge>
              <Badge variant="outline">{session.level}</Badge>
              <Badge variant="outline">{session.meetingProvider}</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
                {session.title}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                {session.description}
              </p>
            </div>
            <div className="grid gap-2 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-2 lg:grid-cols-4">
              <MetaPill icon={CalendarDays} label={formatTrainingDateRu(session.startsAt)} />
              <MetaPill
                icon={Clock}
                label={session.durationMinutes ? `${session.durationMinutes} минут` : "Без ограничения"}
              />
              <MetaPill icon={GraduationCap} label={session.instructor} />
              <MetaPill icon={PlayCircle} label={session.meetingProvider} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <main className="space-y-6">
            <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
              <CardHeader>
                <CardTitle>Программа занятия</CardTitle>
                <CardDescription>
                  Сценарий сделан как clinical workflow: врач быстро понимает, что будет на занятии и зачем.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {session.agenda.map((item, index) => (
                    <li key={item} className="flex gap-3 rounded-2xl bg-[var(--clinical-muted)] p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--clinical-primary)] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-[var(--clinical-foreground)]">{item}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
              <CardHeader>
                <CardTitle>Что получит врач</CardTitle>
                <CardDescription>Практический результат после занятия или просмотра записи.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {session.outcomes.map((outcome) => (
                  <div key={outcome} className="flex gap-3 rounded-2xl border border-[var(--clinical-border)] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{outcome}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
              <CardHeader>
                <CardTitle>Материалы и субтитры</CardTitle>
                <CardDescription>
                  Русский язык — база. Перевод добавляется только после проверки медицинских терминов.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {session.materials.map((material) => (
                    <Badge key={material} variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      {material}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-2xl border border-[var(--clinical-border)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
                    <Languages className="h-4 w-4 text-[var(--clinical-primary)]" />
                    Субтитры и перевод
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.subtitleLanguages.map((language) => (
                      <Badge key={language} variant={language === "ru" ? "default" : "outline"}>
                        {TRAINING_LANGUAGE_LABELS[language]}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                    {session.translationPlan}
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-4">
            <TrainingRegistrationPanel sessionId={session.id} sessionTitle={session.title} />
            <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
              <CardHeader>
                <CardTitle className="text-base">Дисклеймер</CardTitle>
                <CardDescription>
                  Учебный/справочный материал; не является диагнозом. Интерпретацию выполняет специалист.
                </CardDescription>
              </CardHeader>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 shadow-sm dark:bg-[var(--clinical-card)]">
      <Icon className="h-4 w-4 text-[var(--clinical-primary)]" />
      <span>{label}</span>
    </div>
  );
}
