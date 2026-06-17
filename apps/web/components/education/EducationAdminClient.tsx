"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clipboard, ExternalLink, Mail, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  TRAINING_MEETING_PROVIDERS,
  TRAINING_SESSION_FORMATS,
  TRAINING_SESSION_LEVELS,
  TRAINING_SESSION_STATUSES,
  type TrainingMeetingProvider,
  type TrainingSession,
  type TrainingSessionFormat,
  type TrainingSessionLevel,
  type TrainingSessionStatus,
} from "@/lib/education/live-learning";
import {
  EDUCATION_REGISTRATION_STATUS_LABELS,
  EDUCATION_REGISTRATION_STATUSES,
  type EducationRegistration,
  type EducationRegistrationStatus,
} from "@/lib/education/registrations";

type Props = {
  initialSessions: TrainingSession[];
  sessionsSource: "supabase" | "fallback";
  sessionsError: string | null;
  initialRegistrations: EducationRegistration[];
  registrationsError: string | null;
};

const EMPTY_FORM = {
  id: "",
  title: "",
  description: "",
  format: "live" as TrainingSessionFormat,
  status: "planned" as TrainingSessionStatus,
  startsAtLocal: "",
  durationMinutes: "90",
  instructor: "Якубов Р.В.",
  level: "Базовый" as TrainingSessionLevel,
  subtitleLanguages: "ru, en, es",
  translationPlan: "Русский эфир; перевод субтитров после проверки медицинской терминологии.",
  meetingProvider: "Zoom/Meet" as TrainingMeetingProvider,
  meetingUrl: "",
  href: "",
  materials: "чеклист\nзапись\nматериалы",
  tags: "вебинар, обучение",
  agenda: "Клинический алгоритм\nТипичные ошибки\nШаблон протокола",
  outcomes: "Понятный маршрут действий\nГотовые формулировки для практики",
  sortOrder: "100",
};

type SessionForm = typeof EMPTY_FORM;

export function EducationAdminClient({
  initialSessions,
  sessionsSource,
  sessionsError,
  initialRegistrations,
  registrationsError,
}: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionForm, setSessionForm] = useState<SessionForm>(EMPTY_FORM);
  const [savingSession, setSavingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [registrationsLoadError, setRegistrationsLoadError] = useState(registrationsError);
  const [busyRegistrationId, setBusyRegistrationId] = useState<string | null>(null);
  const [broadcastSessionId, setBroadcastSessionId] = useState(initialSessions[0]?.id ?? "");
  const [broadcastFilter, setBroadcastFilter] = useState<"all" | "new" | "contacted" | "confirmed">("confirmed");
  const [broadcastSubject, setBroadcastSubject] = useState("Напоминание о занятии SonoGyn Pro");
  const [broadcastBody, setBroadcastBody] = useState(
    "Здравствуйте! Напоминаем о занятии SonoGyn Pro. Ссылка и материалы будут доступны в карточке занятия.",
  );
  const [broadcastResult, setBroadcastResult] = useState<{ count: number; emails: string[] } | null>(null);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const draft = useMemo(
    () => ({
      id: slugify(sessionForm.title || "new-session"),
      title: sessionForm.title || "Новое занятие",
      description: sessionForm.description || "Краткое описание занятия для врачей.",
      format: "live",
      status: "planned",
      startsAt: null,
      durationMinutes: 90,
      instructor: "Якубов Р.В.",
      level: "Базовый",
      primaryLanguage: "ru",
      subtitleLanguages: ["ru", "en", "es"],
      translationPlan: "Русский эфир; перевод субтитров после проверки медицинской терминологии.",
      meetingProvider: "Zoom/Meet",
      materials: ["чеклист", "запись", "материалы"],
      tags: sessionForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      agenda: ["Клинический алгоритм", "Типичные ошибки", "Шаблон протокола"],
      outcomes: ["Понятный маршрут действий", "Готовые формулировки для практики"],
    }),
    [sessionForm.description, sessionForm.tags, sessionForm.title],
  );

  async function copyDraft() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    toast.success("Черновик занятия скопирован");
  }

  function updateSessionForm<K extends keyof SessionForm>(key: K, value: SessionForm[K]) {
    setSessionForm((current) => ({ ...current, [key]: value }));
  }

  function editSession(session: TrainingSession) {
    setSessionForm({
      id: session.id,
      title: session.title,
      description: session.description,
      format: session.format,
      status: session.status,
      startsAtLocal: session.startsAt ? session.startsAt.slice(0, 16) : "",
      durationMinutes: session.durationMinutes ? String(session.durationMinutes) : "",
      instructor: session.instructor,
      level: session.level,
      subtitleLanguages: session.subtitleLanguages.join(", "),
      translationPlan: session.translationPlan,
      meetingProvider: session.meetingProvider,
      meetingUrl: session.meetingUrl ?? "",
      href: session.href ?? "",
      materials: session.materials.join("\n"),
      tags: session.tags.join(", "),
      agenda: session.agenda.join("\n"),
      outcomes: session.outcomes.join("\n"),
      sortOrder: String(session.sortOrder ?? 100),
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function refreshSessions() {
    const response = await fetch("/api/admin/education/sessions", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { sessions?: TrainingSession[]; error?: string };
    if (!response.ok) {
      toast.error(data.error ?? "Не удалось загрузить занятия");
      return;
    }
    setSessions(data.sessions ?? []);
  }

  async function saveSession() {
    setSavingSession(true);
    try {
      const payload = {
        id: sessionForm.id || slugify(sessionForm.title),
        title: sessionForm.title,
        description: sessionForm.description,
        format: sessionForm.format,
        status: sessionForm.status,
        startsAt: sessionForm.startsAtLocal ? new Date(sessionForm.startsAtLocal).toISOString() : null,
        durationMinutes: sessionForm.durationMinutes ? Number(sessionForm.durationMinutes) : null,
        instructor: sessionForm.instructor,
        level: sessionForm.level,
        primaryLanguage: "ru",
        subtitleLanguages: parseCommaList(sessionForm.subtitleLanguages),
        translationPlan: sessionForm.translationPlan,
        meetingProvider: sessionForm.meetingProvider,
        meetingUrl: sessionForm.meetingUrl || null,
        href: sessionForm.href || null,
        materials: parseLineList(sessionForm.materials),
        tags: parseCommaList(sessionForm.tags),
        agenda: parseLineList(sessionForm.agenda),
        outcomes: parseLineList(sessionForm.outcomes),
        sortOrder: Number(sessionForm.sortOrder || 100),
      };
      const response = await fetch("/api/admin/education/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { session?: TrainingSession; error?: string };
      if (!response.ok || !data.session) {
        toast.error(typeof data.error === "string" ? data.error : "Не удалось сохранить занятие");
        return;
      }
      setSessions((current) => {
        const next = current.filter((session) => session.id !== data.session!.id);
        return [...next, data.session!].sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
      });
      setBroadcastSessionId(data.session.id);
      toast.success("Занятие сохранено");
    } finally {
      setSavingSession(false);
    }
  }

  async function deleteSession(id: string) {
    setDeletingSessionId(id);
    try {
      const response = await fetch(`/api/admin/education/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Не удалось удалить занятие");
        return;
      }
      setSessions((current) => current.filter((session) => session.id !== id));
      toast.success("Занятие удалено");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function createBroadcast() {
    setSendingBroadcast(true);
    setBroadcastResult(null);
    try {
      const response = await fetch("/api/admin/education/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: broadcastSessionId,
          recipientFilter: broadcastFilter,
          subject: broadcastSubject,
          body: broadcastBody,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        broadcast?: { recipient_count: number; recipient_emails: string[] };
        error?: string;
      };
      if (!response.ok || !data.broadcast) {
        toast.error(data.error ?? "Не удалось создать рассылку");
        return;
      }
      setBroadcastResult({
        count: data.broadcast.recipient_count,
        emails: data.broadcast.recipient_emails,
      });
      toast.success("Рассылка сохранена в очередь");
    } finally {
      setSendingBroadcast(false);
    }
  }

  async function refreshRegistrations() {
    setBusyRegistrationId("refresh");
    setRegistrationsLoadError(null);
    try {
      const response = await fetch("/api/admin/education/registrations", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        registrations?: EducationRegistration[];
        error?: string;
      };
      if (!response.ok) {
        setRegistrationsLoadError(data.error ?? "Не удалось загрузить заявки");
        return;
      }
      setRegistrations(data.registrations ?? []);
      toast.success("Заявки обновлены");
    } finally {
      setBusyRegistrationId(null);
    }
  }

  async function updateRegistrationStatus(id: string, status: EducationRegistrationStatus) {
    setBusyRegistrationId(id);
    try {
      const response = await fetch("/api/admin/education/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        registration?: EducationRegistration;
        error?: string;
      };
      if (!response.ok || !data.registration) {
        toast.error(data.error ?? "Не удалось обновить статус");
        return;
      }
      setRegistrations((current) =>
        current.map((registration) => (registration.id === id ? data.registration! : registration)),
      );
      toast.success("Статус заявки обновлён");
    } finally {
      setBusyRegistrationId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <Badge variant="outline">Admin · обучение</Badge>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Управление расписанием
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          MVP-cockpit: видим опубликованные занятия, быстро открываем карточки и готовим черновик нового вебинара.
          Следующий слой — полноценное сохранение занятий в Supabase.
        </p>
      </header>

      {sessionsSource === "fallback" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Сейчас показаны fallback-занятия из кода. Для сохранения/редактирования примените миграцию{" "}
          <code>20260617072000_education_sessions_broadcasts.sql</code>
          {sessionsError ? ` (${sessionsError})` : ""}.
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="outline">Занятия</Badge>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              Расписание и курсы
            </h2>
          </div>
          <Button variant="secondary" onClick={() => void refreshSessions()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить занятия
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id} className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge>{session.status}</Badge>
                <Badge variant="outline">{session.format}</Badge>
                <Badge variant="outline">RU</Badge>
              </div>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription className="leading-relaxed">{session.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/education/${session.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Открыть
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/education">Расписание</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => editSession(session)}>
                Редактировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={deletingSessionId === session.id}
                onClick={() => void deleteSession(session.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </CardContent>
          </Card>
        ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline">Заявки врачей</Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
              Запись на занятия
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
              Здесь админ видит, кто записался, какой вопрос задал и какие субтитры предпочитает.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void refreshRegistrations()}
            disabled={busyRegistrationId === "refresh"}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>

        {registrationsLoadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Не удалось загрузить заявки: {registrationsLoadError}. Проверьте, что применена миграция{" "}
            <code>20260617070000_education_registrations.sql</code>.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          {EDUCATION_REGISTRATION_STATUSES.map((status) => (
            <div key={status} className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                {EDUCATION_REGISTRATION_STATUS_LABELS[status]}
              </p>
              <p className="mt-2 text-2xl font-black text-[var(--clinical-foreground)]">
                {registrations.filter((registration) => registration.status === status).length}
              </p>
            </div>
          ))}
        </div>

        {registrations.length === 0 ? (
          <Card className="border-dashed border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <CardHeader>
              <CardTitle>Заявок пока нет</CardTitle>
              <CardDescription>
                Когда врач нажмёт «Записаться» на странице занятия, заявка появится здесь.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration) => (
              <Card key={registration.id} className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{EDUCATION_REGISTRATION_STATUS_LABELS[registration.status]}</Badge>
                    <Badge variant="outline">Субтитры: {registration.preferredSubtitleLanguage.toUpperCase()}</Badge>
                    <Badge variant="outline">{formatAdminDate(registration.createdAt)}</Badge>
                  </div>
                  <CardTitle className="text-base">{registration.sessionTitle}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {registration.fullName || "ФИО не указано"}
                    {registration.email ? ` · ${registration.email}` : ""}
                  </CardDescription>
                  {registration.question ? (
                    <p className="rounded-xl bg-[var(--clinical-muted)] p-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                      {registration.question}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {EDUCATION_REGISTRATION_STATUSES.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={registration.status === status ? "default" : "outline"}
                      disabled={busyRegistrationId === registration.id}
                      onClick={() => void updateRegistrationStatus(registration.id, status)}
                    >
                      {EDUCATION_REGISTRATION_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--clinical-primary)]" />
              <CardTitle>Создать / редактировать занятие</CardTitle>
            </div>
            <CardDescription>Сохраняется в Supabase и сразу появляется в расписании.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={sessionForm.id}
                onChange={(event) => updateSessionForm("id", event.target.value)}
                placeholder="id: orads-live-ru"
              />
              <Input
                value={sessionForm.sortOrder}
                onChange={(event) => updateSessionForm("sortOrder", event.target.value)}
                placeholder="Порядок"
                inputMode="numeric"
              />
            </div>
            <Input
              value={sessionForm.title}
              onChange={(event) => updateSessionForm("title", event.target.value)}
              placeholder="Название занятия"
            />
            <Textarea
              value={sessionForm.description}
              onChange={(event) => updateSessionForm("description", event.target.value)}
              placeholder="Краткое описание"
              rows={4}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectBox
                value={sessionForm.format}
                values={TRAINING_SESSION_FORMATS}
                onChange={(value) => updateSessionForm("format", value as TrainingSessionFormat)}
              />
              <SelectBox
                value={sessionForm.status}
                values={TRAINING_SESSION_STATUSES}
                onChange={(value) => updateSessionForm("status", value as TrainingSessionStatus)}
              />
              <SelectBox
                value={sessionForm.level}
                values={TRAINING_SESSION_LEVELS}
                onChange={(value) => updateSessionForm("level", value as TrainingSessionLevel)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="datetime-local"
                value={sessionForm.startsAtLocal}
                onChange={(event) => updateSessionForm("startsAtLocal", event.target.value)}
              />
              <Input
                value={sessionForm.durationMinutes}
                onChange={(event) => updateSessionForm("durationMinutes", event.target.value)}
                placeholder="Длительность, мин"
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={sessionForm.instructor}
                onChange={(event) => updateSessionForm("instructor", event.target.value)}
                placeholder="Ведущий"
              />
              <SelectBox
                value={sessionForm.meetingProvider}
                values={TRAINING_MEETING_PROVIDERS}
                onChange={(value) => updateSessionForm("meetingProvider", value as TrainingMeetingProvider)}
              />
            </div>
            <Input
              value={sessionForm.meetingUrl}
              onChange={(event) => updateSessionForm("meetingUrl", event.target.value)}
              placeholder="Zoom / Meet URL"
            />
            <Input
              value={sessionForm.href}
              onChange={(event) => updateSessionForm("href", event.target.value)}
              placeholder="Ссылка на курс/запись (опционально)"
            />
            <Input
              value={sessionForm.subtitleLanguages}
              onChange={(event) => updateSessionForm("subtitleLanguages", event.target.value)}
              placeholder="Субтитры: ru, en, es"
            />
            <Textarea
              value={sessionForm.translationPlan}
              onChange={(event) => updateSessionForm("translationPlan", event.target.value)}
              placeholder="План перевода"
              rows={3}
            />
            <Input
              value={sessionForm.tags}
              onChange={(event) => updateSessionForm("tags", event.target.value)}
              placeholder="теги через запятую"
            />
            <Textarea
              value={sessionForm.materials}
              onChange={(event) => updateSessionForm("materials", event.target.value)}
              placeholder="Материалы — каждый с новой строки"
              rows={3}
            />
            <Textarea
              value={sessionForm.agenda}
              onChange={(event) => updateSessionForm("agenda", event.target.value)}
              placeholder="Программа — каждый пункт с новой строки"
              rows={4}
            />
            <Textarea
              value={sessionForm.outcomes}
              onChange={(event) => updateSessionForm("outcomes", event.target.value)}
              placeholder="Что получит врач — каждый пункт с новой строки"
              rows={3}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => void saveSession()} disabled={savingSession} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {savingSession ? "Сохраняем…" : "Сохранить занятие"}
              </Button>
              <Button variant="secondary" onClick={() => setSessionForm(EMPTY_FORM)}>
                Очистить
              </Button>
              <Button variant="outline" onClick={() => void copyDraft()}>
                <Clipboard className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--clinical-primary)]" />
              <CardTitle>Рассылка по занятию</CardTitle>
            </div>
            <CardDescription>
              Создаёт кампанию в Supabase-очереди. Автоотправку подключим позже через email-провайдер.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={broadcastSessionId}
              onChange={(event) => setBroadcastSessionId(event.target.value)}
              className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
            <select
              value={broadcastFilter}
              onChange={(event) => setBroadcastFilter(event.target.value as typeof broadcastFilter)}
              className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
            >
              <option value="confirmed">Только подтверждённые</option>
              <option value="contacted">С кем связались</option>
              <option value="new">Новые</option>
              <option value="all">Все заявки занятия</option>
            </select>
            <Input value={broadcastSubject} onChange={(event) => setBroadcastSubject(event.target.value)} />
            <Textarea value={broadcastBody} onChange={(event) => setBroadcastBody(event.target.value)} rows={8} />
            <Button onClick={() => void createBroadcast()} disabled={sendingBroadcast || !broadcastSessionId} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              {sendingBroadcast ? "Создаём…" : "Создать рассылку"}
            </Button>
            {broadcastResult ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Кампания создана: получателей {broadcastResult.count}</p>
                {broadcastResult.emails.length > 0 ? (
                  <button
                    type="button"
                    className="mt-2 underline"
                    onClick={() => void navigator.clipboard.writeText(broadcastResult.emails.join(", "))}
                  >
                    Скопировать email-список
                  </button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function formatAdminDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SelectBox({
  value,
  values,
  onChange,
}: {
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
    >
      {values.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function parseLineList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  const ascii = value
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s_-]/giu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || "new-session";
}
