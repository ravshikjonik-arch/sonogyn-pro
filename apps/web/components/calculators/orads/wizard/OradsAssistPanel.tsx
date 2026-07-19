"use client";

import { Brain, Database, Mic, MicOff, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OradsAssistFeedback } from "@/components/calculators/orads/wizard/OradsAssistFeedback";
import { Button } from "@/components/ui/button";
import { useClinicalSpeechRecognition } from "@/hooks/useClinicalSpeechRecognition";
import { useOradsAssist } from "@/hooks/useOradsAssist";
import {
  createClinicalMemory,
  deleteClinicalMemory,
  type ClinicalMemoryRow,
} from "@/lib/orads/oradsEventsApi";
import { formatAgeYearsRu } from "@repo/types";
import type { UseOradsNavigatorReturn } from "@repo/orads-us";

type Props = {
  nav: UseOradsNavigatorReturn;
  profileAgeYears?: number;
  patientId?: string;
  studyId?: string;
};

const FEATURE_LABELS: Record<string, string> = {
  diameterMm: "Макс. размер",
  solidComponent: "Солидный компонент",
  solidComponentMm: "Солидный компонент (мм)",
  vascularity: "Кровоток",
  septations: "Перегородки",
  ascites: "Асцит",
  contour: "Контуры",
  lesionClass: "Тип образования",
  locularity: "Локулярность",
  echogenicity: "Эхогенность",
  ageYears: "Возраст",
  menopause: "Менопауза",
};

export function OradsAssistPanel({ nav, profileAgeYears, patientId, studyId }: Props) {
  const [text, setText] = useState("");
  const [menopause, setMenopause] = useState<"pre" | "post">("pre");
  const [savedMemory, setSavedMemory] = useState<ClinicalMemoryRow | null>(null);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const { analyze, result, loading, error, reset, eventId } = useOradsAssist("web");
  const speech = useClinicalSpeechRecognition({ continuous: true });

  const manualCategory =
    nav.view.kind === "result" ? nav.view.result.categoryNumber : null;

  useEffect(() => {
    if (speech.transcript) setText(speech.transcript);
  }, [speech.transcript]);

  async function onAnalyze(fetchRemoteDraft = false) {
    setSavedMemory(null);
    await analyze({
      text,
      menopause,
      profileAgeYears,
      patientId,
      studyId,
      fetchRemoteDraft,
    });
  }

  function onApplyHints(autoHighOnly: boolean) {
    if (!result?.hints.length) return;
    nav.applyHints(result.hints, autoHighOnly);
  }

  async function onRemember() {
    if (!result) return;
    setMemoryBusy(true);
    try {
      const memory = await createClinicalMemory({
        domain: "orads",
        memoryType: patientId ? "patient_context" : "case_learning",
        title: patientId ? "O-RADS: контекст пациентки" : "O-RADS: клинический разбор",
        detail: `${result.clinicalReasoning.workingCategory}. ${result.clinicalReasoning.summary}`,
        confidence: result.categoryNumber !== null && result.unresolvedNodes.length === 0 ? "high" : "medium",
        patientId,
        sourceEventId: eventId ?? undefined,
        payload: {
          categoryNumber: result.categoryNumber,
          unresolvedNodes: result.unresolvedNodes,
          extracted: result.extracted,
        },
      });
      if (!memory) {
        toast.error("Память пока не сохранена: проверьте миграцию clinical_ai_memory.");
        return;
      }
      setSavedMemory(memory);
      toast.success("Сохранено в клиническую память");
    } finally {
      setMemoryBusy(false);
    }
  }

  async function onForgetSavedMemory() {
    if (!savedMemory) return;
    setMemoryBusy(true);
    try {
      const ok = await deleteClinicalMemory(savedMemory.id);
      if (!ok) {
        toast.error("Не удалось забыть запись памяти");
        return;
      }
      setSavedMemory(null);
      toast.success("Запись памяти архивирована");
    } finally {
      setMemoryBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-700 dark:text-violet-300" />
        <p className="text-sm font-black text-violet-950 dark:text-violet-100">Из описания протокола</p>
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Вставьте фрагмент протокола или продиктуйте. Система извлечёт признаки и подскажет шаги O-RADS — категорию
        считает калькулятор после вашего подтверждения.
      </p>

      {profileAgeYears !== undefined ? (
        <p className="text-xs font-medium text-violet-800 dark:text-violet-200">
          Возраст из профиля пациентки: {formatAgeYearsRu(profileAgeYears)}
        </p>
      ) : null}

      <textarea
        className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Например: киста левого яичника 40 мм, гладкие контуры, без перегородок…"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={speech.listening ? "default" : "outline"}
          className="gap-1.5"
          disabled={!speech.supported}
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
        >
          {speech.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {speech.listening ? "Стоп" : "Диктовка"}
        </Button>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Менопауза
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={menopause}
            onChange={(e) => setMenopause(e.target.value as "pre" | "post")}
          >
            <option value="pre">Пременопауза</option>
            <option value="post">Постменопауза</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={loading || !text.trim()} onClick={() => void onAnalyze()}>
          {loading ? "Разбор…" : "Разобрать описание"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || !text.trim()}
          onClick={() => void onAnalyze(true)}
        >
          Черновик protocol-ai
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { reset(); setText(""); setSavedMemory(null); speech.reset(); }}>
          Очистить
        </Button>
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-xl border border-violet-100 bg-white/80 p-3 dark:border-violet-900/30 dark:bg-slate-950/60">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
            Извлечённые признаки
          </p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
            {Object.entries(result.extracted)
              .filter(([k, v]) => v !== undefined && k !== "sourceText")
              .map(([k, v]) => (
                <li key={k}>
                  <span className="font-semibold">{FEATURE_LABELS[k] ?? k}:</span> {String(v)}
                </li>
              ))}
            {result.context.ageYears !== undefined ? (
              <li>
                <span className="font-semibold">Возраст (контекст):</span> {result.context.ageYears}
                {result.context.ageSource ? ` (${result.context.ageSource})` : ""}
              </li>
            ) : null}
          </ul>

          {result.context.postMenopauseHint ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Подсказка: возраст ≥50 при пременопаузе — уточните статус менопаузы (не меняем автоматически).
            </p>
          ) : null}

          <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/25">
            <div className="flex flex-wrap items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              <p className="text-xs font-black uppercase tracking-wide text-cyan-900 dark:text-cyan-100">
                Клиническое мышление
              </p>
            </div>

            <p className="text-sm font-bold text-cyan-950 dark:text-cyan-50">
              {result.clinicalReasoning.workingCategory}
            </p>
            <p className="text-xs leading-relaxed text-cyan-950/80 dark:text-cyan-100/80">
              {result.clinicalReasoning.summary}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={memoryBusy} onClick={() => void onRemember()}>
                <Database className="h-3.5 w-3.5" />
                {savedMemory ? "Запомнить ещё раз" : "Запомнить разбор"}
              </Button>
              {savedMemory ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={memoryBusy}
                  onClick={() => void onForgetSavedMemory()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Забыть
                </Button>
              ) : null}
            </div>

            {result.clinicalReasoning.memoryInsights.length ? (
              <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2 dark:border-indigo-900/50 dark:bg-indigo-950/25">
                <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-100">
                  <Database className="h-3.5 w-3.5" />
                  Память помощника
                </p>
                <ul className="space-y-1 text-xs text-indigo-950/90 dark:text-indigo-100/90">
                  {result.clinicalReasoning.memoryInsights.map((memory) => (
                    <li key={`${memory.scope}-${memory.title}`} className="rounded-md bg-white/70 p-2 dark:bg-slate-950/45">
                      <p className="font-semibold">
                        {memory.title} · {memory.scope} · вес: {memory.weight}
                      </p>
                      <p className="mt-0.5 leading-relaxed">{memory.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ol className="space-y-2 text-xs text-slate-800 dark:text-slate-100">
              {result.clinicalReasoning.reasoningSteps.map((step) => (
                <li key={step.title} className="rounded-lg bg-white/75 p-2 dark:bg-slate-950/45">
                  <p className="font-bold">{step.title}</p>
                  <p className="mt-0.5">
                    <span className="font-semibold">Найдено:</span> {step.finding}
                  </p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300">{step.interpretation}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                    уверенность: {step.confidence}
                  </p>
                </li>
              ))}
            </ol>

            {result.clinicalReasoning.missingQuestions.length ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-cyan-950 dark:text-cyan-100">Что уточнить врачу</p>
                <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-100">
                  {result.clinicalReasoning.missingQuestions.map((item) => (
                    <li key={item.question} className="rounded-lg bg-white/75 p-2 dark:bg-slate-950/45">
                      <p className="font-semibold">
                        {item.priority === "critical" ? "Критично: " : item.priority === "important" ? "Важно: " : ""}
                        {item.question}
                      </p>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.clinicalReasoning.safetyFlags.length ? (
              <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
                <p className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Контроль безопасности
                </p>
                <ul className="list-disc space-y-0.5 pl-4">
                  {result.clinicalReasoning.safetyFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-1 text-xs text-cyan-950 dark:text-cyan-100">
              <p className="font-bold">Следующий шаг</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {result.clinicalReasoning.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.categoryNumber !== null ? (
            <p className="text-sm font-bold text-[var(--clinical-primary-deep)]">
              Калькулятор (черновик): O-RADS {result.categoryNumber}
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Не все шаги определены — пройдите wizard с подсказками.
              {result.unresolvedNodes.length ? ` Уточнить: ${result.unresolvedNodes.join(", ")}` : null}
            </p>
          )}

          {result.ascitesModifierSuggested ? (
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              Асцит при базовой категории &lt; 5 — после подтверждения проверьте модификатор асцита.
            </p>
          ) : null}

          {result.protocolDraft ? (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                Черновик протокола ({result.protocolDraftSource})
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-900">
                {result.protocolDraft}
              </pre>
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => onApplyHints(true)}>
              Заполнить (только high)
            </Button>
            <Button type="button" size="sm" onClick={() => onApplyHints(false)}>
              Подсказки в wizard
            </Button>
          </div>

          <OradsAssistFeedback
            eventId={eventId}
            aiCategoryNumber={result.categoryNumber}
            manualCategoryNumber={manualCategory}
          />

          <p className="text-[10px] leading-relaxed text-slate-500">
            CDS: не диагноз. Проверьте признаки по гайдлайну ACR O-RADS US v2022.
          </p>
        </div>
      ) : null}
    </div>
  );
}
