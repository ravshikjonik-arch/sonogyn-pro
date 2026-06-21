"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { BiradsImageAssistPanel } from "@/components/calculators/birads/BiradsImageAssistPanel";
import { useBiradsFlow } from "@/components/calculators/birads/BiradsFlowContext";
import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { BreastAiAssistResult } from "@/lib/ai/breast-ultrasound-assist";
import { assistFromFreeText } from "@/lib/birads-us";

const EXAMPLE =
  "Овальное гипоэхогенное образование 12×8 мм, параллельное, чёткие контуры, усиление сзади";

/** AI Breast Assistant — текст + снимок УЗИ → BI-RADS. */
export function BiradsAiAssistant() {
  const { applyFromAi } = useBiradsFlow();
  const [text, setText] = useState("");
  const [result, setResult] = useState<BreastAiAssistResult | ReturnType<typeof assistFromFreeText> | null>(null);
  const [pending, startTransition] = useTransition();

  function analyzeText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setResult(assistFromFreeText(trimmed));
  }

  function onSave() {
    if (!result) return;
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "bi-rads",
        calculatorCode: "BI_RADS_US_AI",
        payload: { text, result },
        summary: `${result.report.engine.category} · AI Assistant`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">BI-RADS US · AI Assistant</p>
        <h2 className="text-xl font-black">Breast Assistant</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
          Текст или снимок УЗИ → US AI Worker (breast) + rule engine BI-RADS.
        </p>
      </div>

      <BiradsImageAssistPanel freeText={text} onResult={setResult} />

      <Textarea
        rows={4}
        placeholder={EXAMPLE}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={analyzeText} disabled={!text.trim()}>
          Анализировать текст
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setText(EXAMPLE)}>
          Пример
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-5">
            <p className="text-lg font-black text-rose-900">{result.suggestedDiagnosis}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-rose-600 text-white">{result.report.engine.category}</Badge>
              <Badge variant="outline">риск {result.report.engine.malignancyRisk}</Badge>
              {"pipeline" in result ? (
                <Badge variant="secondary" className="text-[10px]">
                  {result.pipeline}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm">{result.report.clinicalRecommendation}</p>
            {"workerSummary" in result && result.workerSummary ? (
              <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{result.workerSummary}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => applyFromAi(result, "quick")}>
              Применить к быстрому калькулятору
            </Button>
            <Button type="button" variant="secondary" onClick={() => applyFromAi(result, "brochure")}>
              Применить к брошюре (8 шагов)
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={onSave}>
              {pending ? "Сохранение…" : "Сохранить в истории"}
            </Button>
          </div>

          {result.detectedKeywords.length > 0 ? (
            <CalcStepCard title="Распознанные дескрипторы">
              <div className="flex flex-wrap gap-1">
                {result.detectedKeywords.map((k: string) => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}
                  </Badge>
                ))}
              </div>
            </CalcStepCard>
          ) : null}

          {result.report.engine.matchedPathologies[0] ? (
            <CalcStepCard title="Дифференциальный диагноз">
              <p className="text-sm font-bold">{result.report.engine.matchedPathologies[0]!.nameRu}</p>
              <p className="mt-1 text-xs">{result.report.engine.matchedPathologies[0]!.educationSummary}</p>
            </CalcStepCard>
          ) : null}

          <CalcStepCard title="Структурированный протокол">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">{result.report.fullProtocol}</pre>
          </CalcStepCard>

          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Не является диагнозом. Интерпретация — за лечащим специалистом.
          </p>
        </div>
      ) : null}
    </div>
  );
}
