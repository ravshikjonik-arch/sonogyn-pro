"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TRAINING_LANGUAGE_LABELS, type TrainingLanguage } from "@/lib/education/live-learning";

type Props = {
  sessionId: string;
  sessionTitle: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export function TrainingRegistrationPanel({ sessionId, sessionTitle }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [preferredSubtitleLanguage, setPreferredSubtitleLanguage] = useState<TrainingLanguage>("ru");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setError(null);

    const response = await fetch("/api/education/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        fullName,
        email,
        question,
        preferredSubtitleLanguage,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSubmitState("error");
      setError(data.error ?? "Не удалось отправить заявку");
      return;
    }

    setSubmitState("success");
    setQuestion("");
  }

  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-[var(--clinical-primary)]">Запись</Badge>
          <Badge variant="outline">MVP</Badge>
        </div>
        <CardTitle>Записаться на занятие</CardTitle>
        <CardDescription>
          Заявка сохраняется для администратора. Основной язык занятия — русский; язык субтитров можно указать заранее.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              Занятие
            </label>
            <Input value={sessionTitle} readOnly />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="training-full-name" className="text-sm font-medium">
                ФИО
              </label>
              <Input
                id="training-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Якубов Р.В."
                maxLength={160}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="training-email" className="text-sm font-medium">
                Email для напоминания
              </label>
              <Input
                id="training-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="doctor@example.com"
                inputMode="email"
                maxLength={160}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="training-language" className="text-sm font-medium">
              Предпочтительный язык субтитров
            </label>
            <select
              id="training-language"
              value={preferredSubtitleLanguage}
              onChange={(event) => setPreferredSubtitleLanguage(event.target.value as TrainingLanguage)}
              className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
            >
              {(["ru", "en", "es"] as TrainingLanguage[]).map((language) => (
                <option key={language} value={language}>
                  {TRAINING_LANGUAGE_LABELS[language]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="training-question" className="text-sm font-medium">
              Вопрос к занятию
            </label>
            <Textarea
              id="training-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Например: хочу разобрать папиллярные проекции / раннюю беременность / BI-RADS формулировки"
              maxLength={1000}
              rows={4}
            />
          </div>

          {submitState === "success" ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Заявка отправлена. Если нужно быстро уточнить время — напишите в Telegram-канал.
            </p>
          ) : null}
          {submitState === "error" ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitState === "submitting"}>
            <Send className="mr-2 h-4 w-4" />
            {submitState === "submitting" ? "Отправляем…" : "Записаться"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
