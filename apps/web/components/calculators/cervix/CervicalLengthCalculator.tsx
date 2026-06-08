"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CERVICAL_SOURCE,
  assessCervicalLength,
  buildCervicalProtocol,
  cervicalFormOptions,
  defaultCervicalInput,
  type CervicalAssessmentInput,
} from "@/lib/cervix";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

export function CervicalLengthCalculator() {
  const [input, setInput] = useState<CervicalAssessmentInput>({ ...defaultCervicalInput });
  const [pending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof CervicalAssessmentInput>(key: K, value: CervicalAssessmentInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const assessment = useMemo(() => assessCervicalLength(input), [input]);
  const reportText = useMemo(() => buildCervicalProtocol(input), [input]);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: "cervical-length",
        title: "Протокол · цервикальная длина",
        text: reportText,
      }),
    [reportText],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "cervical-length",
        calculatorCode: "CERVICAL_LENGTH",
        payload: { input, assessment, reportText },
        summary: `CL ${input.cervicalLengthMm ?? "—"} мм · ${assessment.risk}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено");
        else toast.error(res.message);
      });
    });
  }

  const riskClass =
    assessment.risk === "high"
      ? "border-red-400 bg-red-50"
      : assessment.risk === "short"
        ? "border-amber-400 bg-amber-50"
        : "border-emerald-400 bg-emerald-50";

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Каталог</Link>
        </Button>
        <Badge variant="outline">CL · 16–24 нед</Badge>
      </div>

      <header className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Длина шейки матки</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{CERVICAL_SOURCE}</p>
      </header>

      <div className="mx-auto max-w-3xl space-y-4">
        <CalcStepCard title="Измерения">
          <label className="text-xs">
            Срок беременности (нед)
            <Input
              className="mt-1"
              inputMode="numeric"
              value={input.gestationalWeeks ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setField("gestationalWeeks", Number.isFinite(v) ? v : undefined);
              }}
            />
          </label>
          <label className="text-xs">
            CL (мм) — линейка перпендикулярно внутреннему зеву
            <Input
              className="mt-1"
              inputMode="decimal"
              value={input.cervicalLengthMm ?? ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setField("cervicalLengthMm", Number.isFinite(v) ? v : undefined);
              }}
            />
          </label>
          <CalcSubLabel>Форма воронки</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {cervicalFormOptions.funnelShape.map((opt) => (
              <CalcChip
                key={opt.value}
                label={opt.label}
                selected={input.funnelShape === opt.value}
                onClick={() => setField("funnelShape", opt.value)}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.sludgePresent}
              onChange={(e) => setField("sludgePresent", e.target.checked)}
            />
            Sludge у внутреннего зева
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.dynamicShortening}
              onChange={(e) => setField("dynamicShortening", e.target.checked)}
            />
            Динамическое укорочение
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.membraneBulging}
              onChange={(e) => setField("membraneBulging", e.target.checked)}
            />
            Выпячивание оболочек
          </label>
        </CalcStepCard>

        <div className={cn("rounded-xl border p-4 text-sm", riskClass)}>
          <p className="font-bold">Риск: {assessment.risk}</p>
          <ul className="mt-2 list-inside list-disc text-xs">
            {assessment.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <CalcStepCard title="Заключение">
          <Textarea
            rows={3}
            value={input.conclusionDraft ?? ""}
            onChange={(e) => setField("conclusionDraft", e.target.value)}
          />
        </CalcStepCard>

        <pre className="clinical-pre max-h-80 overflow-auto rounded-xl p-4 text-xs whitespace-pre-wrap">
          {reportText}
        </pre>

        <DocumentExportToolbar spec={exportSpec} />
        <Button disabled={pending} onClick={onSave}>
          Сохранить в историю
        </Button>
      </div>
    </div>
  );
}
