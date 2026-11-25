"use client";

import { Check, ClipboardCopy, Map, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  PELVIS_MAP_DISCLAIMER,
  buildProtocolFromPhraseIds,
  getPelvisMapSteps,
  type PelvisMapStepId,
} from "@repo/musa-framework";

import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ZoneId = "uterus" | "mobility" | "posterior" | "neighbors";

const ANATOMY_ZONES: Array<{
  id: ZoneId;
  label: string;
  hint: string;
  stepId: PelvisMapStepId;
  tone: string;
}> = [
  {
    id: "uterus",
    label: "Матка",
    hint: "MUSA · миометрий",
    stepId: "uterus_adenomyosis",
    tone: "bg-[var(--clinical-primary)]/15 border-[var(--clinical-primary)]/40",
  },
  {
    id: "mobility",
    label: "Подвижность",
    hint: "Тракции · боль",
    stepId: "mobility",
    tone: "bg-[var(--clinical-accent-teal)]/15 border-[var(--clinical-accent-teal)]/40",
  },
  {
    id: "posterior",
    label: "Задний компартмент",
    hint: "ДИЭ · ретроцервикально",
    stepId: "posterior_compartment",
    tone: "bg-amber-500/15 border-amber-500/40",
  },
  {
    id: "neighbors",
    label: "Соседи",
    hint: "Мочеточник · кишка",
    stepId: "neighbors",
    tone: "bg-rose-500/10 border-rose-500/30",
  },
];

export function AdenomyosisPelvisMapClient() {
  const steps = useMemo(() => getPelvisMapSteps(), []);
  const [activeId, setActiveId] = useState<PelvisMapStepId>(steps[0]?.id ?? "clinic");
  const [selected, setSelected] = useState<string[]>([]);
  const [doneSteps, setDoneSteps] = useState<Partial<Record<PelvisMapStepId, boolean>>>({});
  const [copied, setCopied] = useState(false);

  const active = steps.find((s) => s.id === activeId) ?? steps[0];
  const protocol = useMemo(() => buildProtocolFromPhraseIds(selected), [selected]);
  const doneCount = steps.filter((s) => doneSteps[s.id]).length;
  const progress = Math.round((doneCount / Math.max(steps.length, 1)) * 100);

  const togglePhrase = (phraseId: string, exclusiveGroup?: string) => {
    setSelected((prev) => {
      const on = prev.includes(phraseId);
      if (on) return prev.filter((id) => id !== phraseId);
      if (!exclusiveGroup) return [...prev, phraseId];
      const groupIds = new Set(
        steps.flatMap((s) => s.phrases.filter((p) => p.exclusiveGroup === exclusiveGroup).map((p) => p.id)),
      );
      return [...prev.filter((id) => !groupIds.has(id)), phraseId];
    });
  };

  const markDoneAndNext = () => {
    if (!active) return;
    setDoneSteps((prev) => ({ ...prev, [active.id]: true }));
    const next = steps.find((s) => s.order === active.order + 1);
    if (next) setActiveId(next.id);
  };

  const copyProtocol = async () => {
    if (!protocol.trim()) return;
    try {
      await navigator.clipboard.writeText(protocol);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-24 lg:px-8">
      <ClinicalAssistStrip
        context={{
          title: "Карта таза · аденомиоз / ДИЭ",
          mode: "gynecology",
          voiceProfile: "general",
          ultrasoundFocus: ["adenomyosis", "DIE", "ENZIAN", "posterior compartment"],
        }}
        compact
      />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/musa/adenomyosis">← MUSA аденомиоз</Link>
          </Button>
          <Badge variant="outline">Маршрут осмотра</Badge>
          <Badge variant="secondary">MUSA + ENZIAN</Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="size-3" aria-hidden />
            CDS
          </Badge>
        </div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Map className="size-7 shrink-0 text-[var(--clinical-primary)]" aria-hidden />
          Карта малого таза при аденомиозе и ДИЭ
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {PELVIS_MAP_DISCLAIMER}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <Link className="text-[var(--clinical-primary)] underline-offset-4 hover:underline" href="/musa/adenomyosis">
            MUSA · признаки и score →
          </Link>
          <Link
            className="text-[var(--clinical-primary)] underline-offset-4 hover:underline"
            href="/tools/calc/gyn/ultrasound-10-steps"
          >
            УЗИ малого таза · 10 шагов →
          </Link>
        </div>
      </header>

      {/* Схема компартментов — клик ведёт на шаг */}
      <section
        aria-label="Схема отделов малого таза"
        className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-[var(--clinical-card-shadow)]"
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--clinical-foreground)]">Анатомическая карта</p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Нажмите зону — откроется соответствующий шаг осмотра
            </p>
          </div>
          <p className="text-xs tabular-nums text-[var(--clinical-foreground-muted)]" aria-live="polite">
            Пройдено {doneCount}/{steps.length} · {progress}%
          </p>
        </div>
        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--clinical-muted)]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс шагов осмотра"
        >
          <div
            className="h-full rounded-full bg-[var(--clinical-primary)] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ANATOMY_ZONES.map((zone) => {
            const linked = steps.find((s) => s.id === zone.stepId);
            const activeZone = activeId === zone.stepId;
            const done = linked ? !!doneSteps[linked.id] : false;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveId(zone.stepId)}
                aria-pressed={activeZone}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]",
                  zone.tone,
                  activeZone && "ring-2 ring-[var(--clinical-primary)] ring-offset-2 ring-offset-[var(--clinical-card)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{zone.label}</span>
                  {done ? <Check className="size-4 text-teal-700 dark:text-teal-300" aria-label="Шаг отмечен" /> : null}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--clinical-foreground-muted)]">{zone.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="space-y-4">
          <nav
            className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
            aria-label="Шаги осмотра"
          >
            {steps.map((step) => {
              const done = !!doneSteps[step.id];
              const activeStep = step.id === activeId;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveId(step.id)}
                  aria-current={activeStep ? "step" : undefined}
                  className={cn(
                    "flex min-w-[9.5rem] shrink-0 items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)] lg:min-w-0 lg:w-full",
                    activeStep
                      ? "bg-[var(--clinical-primary)] text-white"
                      : "bg-[var(--clinical-muted)]/60 text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      activeStep
                        ? "bg-white/20"
                        : done
                          ? "bg-teal-600 text-white"
                          : "bg-[var(--clinical-card)] text-[var(--clinical-foreground-muted)]",
                    )}
                  >
                    {done ? <Check className="size-3" aria-hidden /> : step.order}
                  </span>
                  <span className="leading-snug">{step.title}</span>
                </button>
              );
            })}
          </nav>

          {active ? (
            <article
              className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 shadow-[var(--clinical-card-shadow)] sm:p-6"
              aria-labelledby="pelvis-map-step-title"
            >
              <header className="space-y-2 border-b border-[var(--clinical-border)] pb-4">
                <h2 id="pelvis-map-step-title" className="text-lg font-bold tracking-tight sm:text-xl">
                  Шаг {active.order}. {active.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{active.anatomyFocus}</p>
              </header>

              <div className="mt-5 space-y-5">
                <section>
                  <h3 className="text-sm font-bold">На что смотреть</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {active.lookFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                {active.pitfalls.length > 0 ? (
                  <section className="rounded-xl border border-amber-500/35 bg-amber-500/8 px-3.5 py-3">
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">Типичные ошибки</h3>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                      {active.pitfalls.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section>
                  <h3 className="text-sm font-bold">Фразы в протокол</h3>
                  <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                    Отметьте блоки — они появятся в превью справа. Пробелы «__» заполните измерениями.
                  </p>
                  <div className="mt-3 space-y-2" role="group" aria-label="Фразы протокола">
                    {active.phrases.map((phrase) => {
                      const on = selected.includes(phrase.id);
                      return (
                        <label
                          key={phrase.id}
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-[var(--clinical-primary)]",
                            on
                              ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
                              : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]/40",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 size-4 accent-[var(--clinical-primary)]"
                            checked={on}
                            onChange={() => togglePhrase(phrase.id, phrase.exclusiveGroup)}
                          />
                          <span>
                            <span className="font-semibold">{phrase.label}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                              {phrase.text}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" onClick={markDoneAndNext}>
                    {active.order < steps.length - 1 ? "Шаг выполнен → дальше" : "Шаг выполнен"}
                  </Button>
                  {doneSteps[active.id] ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDoneSteps((prev) => ({ ...prev, [active.id]: false }))}
                    >
                      Снять отметку
                    </Button>
                  ) : null}
                  {active.order < steps.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = steps.find((s) => s.order === active.order + 1);
                        if (next) setActiveId(next.id);
                      }}
                    >
                      Пропустить →
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}
        </div>

        {/* Refero: живой лист протокола */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-canvas)] p-3 shadow-[var(--clinical-card-shadow)]">
            <div
              className="rounded-xl bg-[var(--clinical-card)] px-4 py-5 sm:px-5"
              role="region"
              aria-label="Превью протокола"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--clinical-border)] pb-3">
                <div>
                  <p className="text-base font-semibold text-[var(--clinical-accent-teal)]">Лист протокола</p>
                  <p className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]">
                    {selected.length} фрагмент(ов) · автосборка
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!protocol}
                    onClick={() => void copyProtocol()}
                    aria-label={copied ? "Скопировано" : "Копировать протокол"}
                  >
                    <ClipboardCopy className="size-4" aria-hidden />
                    {copied ? "Готово" : "Копировать"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={selected.length === 0} onClick={() => setSelected([])}>
                    Очистить
                  </Button>
                </div>
              </div>
              <pre className="clinical-pre mt-4 min-h-[220px] max-h-[min(60vh,520px)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--clinical-foreground)]">
                {protocol || "Отметьте фразы на шагах — здесь появится текст для протокола УЗИ."}
              </pre>
              {protocol ? (
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">
                  Замените «__» на измерения. CDS · не морфологический диагноз.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
