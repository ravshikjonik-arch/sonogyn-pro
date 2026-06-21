"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { TiradsImageAssistPanel } from "@/components/calculators/tirads/TiradsImageAssistPanel";
import { useTiradsFlow } from "@/components/calculators/tirads/TiradsFlowContext";
import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ThyroidAiAssistResult } from "@/lib/ai/thyroid-ultrasound-assist";
import { assistFromTiradsText } from "@/lib/tirads-acr";

const EXAMPLE =
  "Солидный гипоэхогенный узел 11 мм, taller-than-wide, пунктатные микрокальцинаты, неровные контуры — подозрение на папиллярный рак";

export function TiradsAiAssistant() {
  const { applyFromAi } = useTiradsFlow();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ThyroidAiAssistResult | ReturnType<typeof assistFromTiradsText> | null>(null);
  const [pending, startTransition] = useTransition();

  function analyzeText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setResult(assistFromTiradsText(trimmed));
  }

  function onSave() {
    if (!result) return;
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "ti-rads",
        calculatorCode: "TI_RADS_ACR_AI",
        payload: { text, result },
        summary: `${result.report.result.category} · AI Assistant`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <div>
        <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">ACR TI-RADS · AI Assistant</p>
        <h2 className="text-xl font-black">Thyroid Assistant</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
          Текст или снимок УЗИ → US AI Worker + rule engine ACR TI-RADS.
        </p>
      </div>

      <TiradsImageAssistPanel freeText={text} onResult={setResult} />

      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={analyzeText} disabled={!text.trim()}>
          Анализировать текст
        </Button>
        <Button variant="outline" size="sm" onClick={() => setText(EXAMPLE)}>
          Пример PTC
        </Button>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-sky-300 bg-sky-50 p-4">
            <p className="font-black text-sky-900">{result.suggestedDiagnosis}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{result.report.result.category}</Badge>
              <Badge variant="outline">{result.report.result.totalPoints} pts</Badge>
              {"pipeline" in result ? (
                <Badge variant="secondary" className="text-[10px]">
                  {result.pipeline}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm">{result.report.result.fnaRationale}</p>
            {"workerSummary" in result && result.workerSummary ? (
              <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{result.workerSummary}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => applyFromAi(result)}>Применить к ACR калькulatorу</Button>
            <Button variant="outline" disabled={pending} onClick={onSave}>
              {pending ? "Сохранение…" : "Сохранить в истории"}
            </Button>
          </div>

          {result.detectedKeywords.length ? (
            <CalcStepCard title="Дескрипторы">
              <div className="flex flex-wrap gap-1">
                {result.detectedKeywords.map((k) => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}
                  </Badge>
                ))}
              </div>
            </CalcStepCard>
          ) : null}

          <CalcStepCard title="Протокол">
            <pre className="whitespace-pre-wrap text-xs">{result.report.fullProtocol}</pre>
          </CalcStepCard>

          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Не является диагнозом. Интерпретация — за лечащим специалистом.
          </p>
        </div>
      ) : null}
    </div>
  );
}
