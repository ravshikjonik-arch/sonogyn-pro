"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/providers";
import { ClinicalRichTextEditor } from "@/components/clinical/ClinicalRichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PILOT_CASE_DISCUSSION_CHANNELS } from "@/lib/chat/pilot-channels";
import { CASE_ANON_CHECKS } from "@/lib/cases/anonymization-gate";
import { cn } from "@/lib/utils/cn";

type CaseKind = "library" | "discussion";

const STEPS = ["Контекст", "Описание", "Media", "Анонимизация"] as const;

/**
 * P0 wizard: 4 шага перед созданием draft-кейса (Step 4 gate R6).
 */
export function NewCaseWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [anatomy, setAnatomy] = useState("");
  const [caseKind, setCaseKind] = useState<CaseKind>("discussion");
  const [channelId, setChannelId] = useState<string>(PILOT_CASE_DISCUSSION_CHANNELS[0]!.id);
  const [channels] = useState(PILOT_CASE_DISCUSSION_CHANNELS);
  const [anonChecks, setAnonChecks] = useState<boolean[]>([false, false, false]);
  const [anonConfirmed, setAnonConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnonOk = anonChecks.every(Boolean) && anonConfirmed;

  useEffect(() => {
    const t = searchParams.get("title");
    const d = searchParams.get("description");
    const a = searchParams.get("anatomy");
    if (t) setTitle(t);
    if (d) {
      setDescription(d);
      setDescriptionHtml("");
    }
    if (a) setAnatomy(a);

    const feed = searchParams.get("feed");
    const preselectedChannel = searchParams.get("channelId");
    if (feed === "discussions") setCaseKind("discussion");
    if (
      preselectedChannel &&
      PILOT_CASE_DISCUSSION_CHANNELS.some((ch) => ch.id === preselectedChannel)
    ) {
      setChannelId(preselectedChannel);
    }
  }, [searchParams]);

  function nextStep() {
    setError(null);
    if (step === 0 && caseKind === "discussion" && !channelId) {
      setError("Выберите раздел для вопроса коллегам.");
      return;
    }
    if (step === 1 && !title.trim()) {
      setError("Укажите заголовок кейса.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnonOk) {
      setError("Подтвердите чеклист анонимизации перед публикацией.");
      return;
    }
    setBusy(true);
    setError(null);

    if (!user?.id) {
      setError("Сессия истекла — войдите снова.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Кейс без названия",
        description: description.trim() || null,
        description_html: descriptionHtml.trim() || null,
        anatomy: anatomy.trim() || null,
        pathology: searchParams.get("pathology")?.trim() || null,
        channel_id: caseKind === "discussion" ? channelId : null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { id?: string; error?: unknown } | null;

    if (!response.ok || !payload?.id) {
      setError(typeof payload?.error === "string" ? payload.error : "Не удалось создать кейс.");
      setBusy(false);
      return;
    }

    router.push(`/cases/${payload.id}`);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-12 pb-28">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Чат врачей · шаг {step + 1} из {STEPS.length}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Новый кейс для обсуждения
        </h1>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                i === step
                  ? "bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                  : i < step
                    ? "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]"
                    : "border border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
              )}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-sm"
        onSubmit={step === STEPS.length - 1 ? createDraft : (ev) => { ev.preventDefault(); nextStep(); }}
      >
        {step === 0 ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-[var(--clinical-foreground)]">Куда публикуем</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition",
                  caseKind === "library"
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                    : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
                )}
                onClick={() => setCaseKind("library")}
              >
                Учебная библиотека
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition",
                  caseKind === "discussion"
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                    : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
                )}
                onClick={() => setCaseKind("discussion")}
              >
                Вопрос коллегам
              </button>
            </div>
            {caseKind === "discussion" ? (
              <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
                Раздел
                <select
                  className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
                  value={channelId}
                  onChange={(event) => setChannelId(event.target.value)}
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
              Заголовок кейса
              <Input
                placeholder="напр. O-RADS 4 · кистозно-солидное образование левого яичника"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
              Клинический вопрос
              <ClinicalRichTextEditor
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                onPlainTextChange={setDescription}
                placeholder="Что хотите обсудить с коллегами? Возрастная группа, находка, сомнения по тактике…"
                minHeightClassName="min-h-[120px]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
              Зона УЗИ
              <Input
                placeholder="матка / яичники / ранняя беременность / МЖ"
                value={anatomy}
                onChange={(event) => setAnatomy(event.target.value)}
              />
            </label>
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3 text-sm text-[var(--clinical-foreground-muted)]">
            <p className="font-semibold text-[var(--clinical-foreground)]">Снимки — на следующем экране</p>
            <p>
              После создания черновика вы перейдёте в карточку кейса и сможете загрузить фото, видео или DICOM.
              Публичное превью в ленте появится только после прохождения анонимизации (gate R6).
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-[var(--clinical-foreground)]">
              Чеклист анонимизации (Step 4)
            </legend>
            <ul className="space-y-3">
              {CASE_ANON_CHECKS.map((label, i) => (
                <li key={label}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={anonChecks[i]}
                      onChange={(e) => {
                        const next = [...anonChecks];
                        next[i] = e.target.checked;
                        setAnonChecks(next);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={anonConfirmed}
                onChange={(e) => setAnonConfirmed(e.target.checked)}
              />
              <span>
                Подтверждаю: кейс не содержит персональных данных пациента. Интерпретация обсуждения — не
                диагноз; окончательное решение принимает лечащий врач.
              </span>
            </label>
          </fieldset>
        ) : null}

        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Назад
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button type="submit">Далее</Button>
          ) : (
            <Button type="submit" disabled={busy || !allAnonOk}>
              {busy ? "Сохранение…" : "Создать и загрузить снимки"}
            </Button>
          )}
          <Button variant="ghost" type="button" asChild>
            <Link href="/cases?tab=cases">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
