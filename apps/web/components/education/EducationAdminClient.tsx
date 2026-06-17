"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clipboard, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TRAINING_SESSIONS } from "@/lib/education/live-learning";
import {
  EDUCATION_REGISTRATION_STATUS_LABELS,
  EDUCATION_REGISTRATION_STATUSES,
  type EducationRegistration,
  type EducationRegistrationStatus,
} from "@/lib/education/registrations";

type Props = {
  initialRegistrations: EducationRegistration[];
  registrationsError: string | null;
};

export function EducationAdminClient({ initialRegistrations, registrationsError }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("вебинар, обучение");
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [registrationsLoadError, setRegistrationsLoadError] = useState(registrationsError);
  const [busyRegistrationId, setBusyRegistrationId] = useState<string | null>(null);

  const draft = useMemo(
    () => ({
      id: slugify(title || "new-session"),
      title: title || "Новое занятие",
      description: description || "Краткое описание занятия для врачей.",
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
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      agenda: ["Клинический алгоритм", "Типичные ошибки", "Шаблон протокола"],
      outcomes: ["Понятный маршрут действий", "Готовые формулировки для практики"],
    }),
    [description, tags, title],
  );

  async function copyDraft() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    toast.success("Черновик занятия скопирован");
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

      <section className="grid gap-4 lg:grid-cols-2">
        {TRAINING_SESSIONS.map((session) => (
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
            </CardContent>
          </Card>
        ))}
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

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--clinical-primary)]" />
              <CardTitle>Черновик нового занятия</CardTitle>
            </div>
            <CardDescription>Быстрый шаблон для будущего вебинара. Основной язык — русский.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название занятия" />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Краткое описание"
              rows={4}
            />
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="теги через запятую" />
            <Button onClick={() => void copyDraft()} className="w-full">
              <Clipboard className="mr-2 h-4 w-4" />
              Скопировать JSON-черновик
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[var(--clinical-border)] bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Preview JSON</CardTitle>
            <CardDescription className="text-slate-300">
              Этот объект можно перенести в каталог занятий или использовать как основу для DB-формы.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] overflow-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed">
              {JSON.stringify(draft, null, 2)}
            </pre>
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
