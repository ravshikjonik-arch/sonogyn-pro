"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clipboard, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TRAINING_SESSIONS } from "@/lib/education/live-learning";

export function EducationAdminClient() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("вебинар, обучение");

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
