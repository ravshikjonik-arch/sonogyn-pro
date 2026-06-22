"use client";

import { Mic, MicOff, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { OradsAssistFeedback } from "@/components/calculators/orads/wizard/OradsAssistFeedback";
import { Button } from "@/components/ui/button";
import { useClinicalSpeechRecognition } from "@/hooks/useClinicalSpeechRecognition";
import { useOradsAssist } from "@/hooks/useOradsAssist";
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
  const { analyze, result, loading, error, reset, eventId } = useOradsAssist("web");
  const speech = useClinicalSpeechRecognition({ continuous: true });

  const manualCategory =
    nav.view.kind === "result" ? nav.view.result.categoryNumber : null;

  useEffect(() => {
    if (speech.transcript) setText(speech.transcript);
  }, [speech.transcript]);

  async function onAnalyze(fetchRemoteDraft = false) {
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
        <Button type="button" size="sm" variant="ghost" onClick={() => { reset(); setText(""); speech.reset(); }}>
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
