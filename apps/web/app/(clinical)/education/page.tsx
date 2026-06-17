import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Languages,
  PlayCircle,
  Send,
  Subtitles,
  Video,
} from "lucide-react";
import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TELEGRAM_CHANNEL } from "@/lib/brand/telegram";
import {
  EDUCATION_PRIMARY_LANGUAGE,
  formatTrainingDateRu,
  LEARNING_TRACKS,
  TRAINING_LANGUAGE_LABELS,
  TRAINING_SESSIONS,
  type TrainingSession,
} from "@/lib/education/live-learning";

const formatLabel: Record<TrainingSession["format"], string> = {
  live: "Онлайн-занятие",
  recording: "Запись",
  course: "Курс",
};

const statusLabel: Record<TrainingSession["status"], string> = {
  registration: "Набор интереса",
  planned: "Планируется",
  recorded: "Доступно",
};

export default function EducationPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="sonogyn-glass-card sonogyn-hero-orbs relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--clinical-primary)]/10 via-transparent to-amber-400/10" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-[var(--clinical-primary)]/30 bg-white/70">
                Обучение
              </Badge>
              <Badge className="gap-1 bg-[var(--clinical-primary)]">
                <Languages className="h-3 w-3" />
                основной язык — {TRAINING_LANGUAGE_LABELS[EDUCATION_PRIMARY_LANGUAGE].toLowerCase()}
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
                Расписание занятий и курсы SonoGyn Pro
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                Русскоязычные вебинары, курсы и записи для врачей УЗИ и акушеров-гинекологов. Многоязычность
                закладываем сразу: сначала русские субтитры, затем перевод субтитров на английский и испанский.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="sonogyn-cta-glow">
                <Link href="#schedule">Открыть расписание</Link>
              </Button>
              <Button variant="secondary" asChild>
                <a href={TELEGRAM_CHANNEL.url} target="_blank" rel="noopener noreferrer">
                  Предложить тему
                </a>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Video}
            title="Онлайн как Zoom"
            text="На первом шаге подключаем ссылку Zoom/Meet/Telegram к занятию. Позже можно заменить на встроенный видеокласс."
          />
          <InfoCard
            icon={Subtitles}
            title="Субтитры"
            text="Для записей планируем русские субтитры как обязательную базу, затем EN/ES для международной аудитории."
          />
          <InfoCard
            icon={Languages}
            title="Перевод"
            text="Автоперевод лучше подключать после записи: так проще проверить медицинскую терминологию перед публикацией."
          />
        </section>

        <section className="sonogyn-glass-card rounded-3xl p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-3">
              <Badge variant="outline">Навигация для врача</Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
                Один экран — весь путь обучения
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                Логика как на хорошей УЗ-станции: сначала главный сценарий, затем детали. Врач не ищет
                “где курс”, “где эфир”, “где запись” — всё собрано в одном маршруте.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <WorkflowStep index="1" title="Расписание" text="Дата, тема, формат, ведущий" />
              <WorkflowStep index="2" title="Эфир" text="Zoom/Meet сейчас, встроенный класс позже" />
              <WorkflowStep index="3" title="Запись" text="Видео, конспект, чеклист" />
              <WorkflowStep index="4" title="Субтитры" text="RU база, EN/ES после проверки" />
            </div>
          </div>
        </section>

        <section id="schedule" className="space-y-4 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge variant="outline">Расписание занятий</Badge>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
                Ближайшие вебинары и записи
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
                Карточки уже поддерживают формат занятия, ссылку на эфир, материалы и список языков субтитров.
              </p>
            </div>
            <TelegramChannelLink compact className="w-full max-w-sm" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {TRAINING_SESSIONS.map((session) => (
              <TrainingSessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <Badge variant="outline">Курсы</Badge>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              Учебные треки
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
              База остаётся русской. Английский и испанский — как слой субтитров и переводов, без смешения в интерфейсе.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {LEARNING_TRACKS.map((track) => (
              <Card key={track.id} className="flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={track.status === "active" ? "bg-emerald-600" : "bg-slate-500"}>
                      {track.status === "active" ? "Доступно" : "План"}
                    </Badge>
                    <Badge variant="outline">RU</Badge>
                  </div>
                  <CardTitle className="text-base">{track.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{track.description}</CardDescription>
                  <div className="flex flex-wrap gap-1.5">
                    {track.modules.map((module) => (
                      <span
                        key={module}
                        className="rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] text-[var(--clinical-foreground-muted)]"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <LanguageBadges languages={track.subtitleLanguages} />
                  <Button variant={track.status === "active" ? "default" : "secondary"} className="w-full" asChild>
                    <Link href={track.href}>{track.status === "active" ? "Открыть" : "Посмотреть основу"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <Badge variant="outline">Правило качества</Badge>
              <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">
                Перевод не должен портить медицинскую точность
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                Для клинических тем сначала публикуем русскую версию. Перевод субтитров включаем после проверки
                терминов: O-RADS, IOTA, BI-RADS, FMF, FIGO и формулировок протокола. Материал учебный и справочный;
                он не является диагнозом, интерпретацию выполняет специалист.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/library">Открыть библиотеку</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkflowStep({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-white/70 p-4 shadow-sm dark:bg-[var(--clinical-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--clinical-primary)] text-xs font-bold text-white">
          {index}
        </span>
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      </div>
      <p className="font-semibold text-[var(--clinical-foreground)]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{text}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Video;
  title: string;
  text: string;
}) {
  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-relaxed">{text}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function TrainingSessionCard({ session }: { session: TrainingSession }) {
  const hasLiveLink = Boolean(session.meetingUrl);
  const actionHref = session.href ?? session.meetingUrl;

  return (
    <Card className="flex flex-col border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={session.status === "recorded" ? "bg-emerald-600" : "bg-[var(--clinical-primary)]"}>
            {statusLabel[session.status]}
          </Badge>
          <Badge variant="outline">{formatLabel[session.format]}</Badge>
          <Badge variant="outline">{session.level}</Badge>
        </div>
        <CardTitle className="text-lg">{session.title}</CardTitle>
        <CardDescription className="leading-relaxed">{session.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="grid gap-2 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-2">
          <MetaLine icon={CalendarDays} label={formatTrainingDateRu(session.startsAt)} />
          <MetaLine
            icon={Clock}
            label={session.durationMinutes ? `${session.durationMinutes} минут` : "Без ограничения"}
          />
          <MetaLine icon={GraduationCap} label={session.instructor} />
          <MetaLine icon={PlayCircle} label={session.meetingProvider} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            Субтитры / перевод
          </p>
          <LanguageBadges languages={session.subtitleLanguages} />
          <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{session.translationPlan}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {session.materials.map((material) => (
            <span
              key={material}
              className="rounded-full bg-[var(--clinical-muted)] px-2 py-0.5 text-[10px] text-[var(--clinical-foreground-muted)]"
            >
              {material}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {actionHref ? (
            <Button className="flex-1" asChild>
              <Link href={actionHref}>{session.format === "live" && hasLiveLink ? "Войти в эфир" : "Открыть"}</Link>
            </Button>
          ) : (
            <Button className="flex-1" disabled>
              Ссылка появится позже
            </Button>
          )}
          <Button variant="secondary" className="flex-1" asChild>
            <a href={TELEGRAM_CHANNEL.url} target="_blank" rel="noopener noreferrer">
              <Send className="mr-2 h-4 w-4" />
              Записаться
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetaLine({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[var(--clinical-muted)] px-3 py-2">
      <Icon className="h-4 w-4 text-[var(--clinical-primary)]" />
      <span>{label}</span>
    </div>
  );
}

function LanguageBadges({ languages }: { languages: Array<keyof typeof TRAINING_LANGUAGE_LABELS> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.map((language) => (
        <Badge key={language} variant={language === "ru" ? "default" : "outline"}>
          {TRAINING_LANGUAGE_LABELS[language]}
        </Badge>
      ))}
    </div>
  );
}
