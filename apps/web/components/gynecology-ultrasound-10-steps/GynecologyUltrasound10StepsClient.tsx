"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

import {
  GYN_US_10_STORAGE_KEY,
  GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE,
  SOURCE_CLINICAL_VALIDATION_REQUIRED,
  createEmptyDraftState,
  getOrderedSteps,
  renderProtocolText,
  stepCompletionHint,
  type ProtocolDraftState,
  type StepState,
} from "@repo/gynecology-ultrasound-10-steps";

import { ProtocolFieldEditor } from "@/components/gynecology-ultrasound-10-steps/ProtocolFieldEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function loadDraft(): ProtocolDraftState {
  if (typeof window === "undefined") return createEmptyDraftState();
  try {
    const raw = localStorage.getItem(GYN_US_10_STORAGE_KEY);
    if (!raw) return createEmptyDraftState();
    const parsed = JSON.parse(raw) as ProtocolDraftState;
    if (parsed?.schemaVersion && parsed.steps) return parsed;
  } catch {
    /* ignore */
  }
  return createEmptyDraftState();
}

export function GynecologyUltrasound10StepsClient() {
  const steps = useMemo(() => getOrderedSteps(), []);
  const [draft, setDraft] = useState<ProtocolDraftState>(() => createEmptyDraftState());
  const [activeStepId, setActiveStepId] = useState(steps[0]?.id ?? "uterus_general");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const next = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(GYN_US_10_STORAGE_KEY, JSON.stringify(next));
  }, [draft, hydrated]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(draft.steps).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [draft.steps]);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0]!;
  const previewText = useMemo(() => renderProtocolText(draft), [draft]);

  const setStepState = useCallback((stepId: string, stepState: StepState) => {
    setDraft((prev) => ({
      ...prev,
      steps: { ...prev.steps, [stepId]: stepState },
    }));
  }, []);

  const copyPreview = async () => {
    if (!previewText.trim()) return;
    await navigator.clipboard.writeText(previewText);
    toast.success("Текст протокола скопирован");
  };

  const resetDraft = () => {
    if (!window.confirm("Очистить черновик на этом устройстве?")) return;
    setDraft(createEmptyDraftState());
    localStorage.removeItem(GYN_US_10_STORAGE_KEY);
    toast.message("Черновик очищен");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">SonoGyn Pro</p>
        <h1 className="text-2xl font-bold text-[var(--clinical-foreground)]">{GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE.title}</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Структура и формулировки — из приложенного руководства (10 шагов). Числовые пороги и единицы матки требуют
          клинического подтверждения (
          {SOURCE_CLINICAL_VALIDATION_REQUIRED ? "sourceClinicalValidationRequired" : "—"}).
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Источник в репозитории:{" "}
          <a href="/docs/sonogyn-pro-cursor/00_README.md" className="underline">
            docs/sonogyn-pro-cursor
          </a>
          ·{" "}
          <a href="/docs/sonogyn-pro-cursor/source-pages/page-003.png" className="underline" target="_blank" rel="noreferrer">
            сверка со страницами PDF
          </a>
        </p>
      </header>

      <div
        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
        role="tablist"
        aria-label="Шаги протокола"
      >
        {steps.map((step) => {
          const status = stepCompletionHint(step.id, draft.steps[step.id]);
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={step.id === activeStepId}
              onClick={() => setActiveStepId(step.id)}
              className={cn(
                "min-w-[9.5rem] shrink-0 snap-start rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
                step.id === activeStepId
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] shadow-sm"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:border-[var(--clinical-primary-deep)]",
              )}
            >
              <span className="text-[10px] font-bold text-[var(--clinical-foreground-muted)]">Шаг {step.order}</span>
              <span className="mt-1 block text-sm font-bold leading-tight">{step.shortTitle}</span>
              <span className="mt-1 block text-[10px] text-[var(--clinical-foreground-muted)]">
                {status === "empty" ? "не начато" : status === "partial" ? "заполнено частично" : "есть данные"}
              </span>
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6 shadow-[var(--clinical-card-shadow)]">
        <h2 className="text-lg font-bold">{activeStep.title}</h2>
        {activeStep.sourceNote ? (
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{activeStep.sourceNote}</p>
        ) : null}

        {activeStep.id === "ovaries" ? (
          <div className="mt-4 space-y-6">
            {(activeStep.instances ?? []).map((inst) => {
              const sideState = (draft.steps.ovaries?.[inst.id] as StepState | undefined) ?? {};
              return (
                <div key={inst.id} className="rounded-2xl border border-[var(--clinical-border)] p-4">
                  <h3 className="mb-3 font-semibold">{inst.label}</h3>
                  {(activeStep.fields as Record<string, unknown>[]).map((field) => (
                    <ProtocolFieldEditor
                      key={String(field.id)}
                      field={field}
                      state={sideState}
                      onChange={(next) => {
                        const ovaries = { ...(draft.steps.ovaries ?? {}), [inst.id]: next };
                        setStepState("ovaries", ovaries);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {((activeStep.fields ?? []) as Record<string, unknown>[]).map((field) => (
              <ProtocolFieldEditor
                key={String(field.id)}
                field={field}
                state={draft.steps[activeStep.id] ?? {}}
                onChange={(next) => setStepState(activeStep.id, next)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={activeStep.order <= 1} onClick={() => setActiveStepId(steps[activeStep.order - 2]!.id)}>
            Назад
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={activeStep.order >= steps.length}
            onClick={() => setActiveStepId(steps[activeStep.order]!.id)}
          >
            Далее
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Предпросмотр протокола</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => void copyPreview()} disabled={!previewText.trim()}>
              <ClipboardCopy className="mr-1 h-4 w-4" />
              Копировать
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetDraft}>
              Очистить черновик
            </Button>
          </div>
        </div>
        <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--clinical-muted)] p-4 text-sm leading-relaxed text-[var(--clinical-foreground)]">
          {previewText || "Выберите признаки и измерения — текст появится здесь."}
        </pre>
        <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">
          O-RADS и IOTA ADNEX MODEL — только через{" "}
          <Link href="/tools/calc/rads/o-rads" className="underline">
            существующие модули
          </Link>
          ; правила из PDF не воспроизводятся.
        </p>
      </section>
    </div>
  );
}
