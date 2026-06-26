"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { useLnRadsFlow } from "@/components/calculators/lnrads/LnRadsFlowContext";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DOPPLER_OPTIONS,
  LN_RADS_VERSION,
  enrichEngineResult,
  generateStructuredReport,
  lnRadsOptions,
  type LnRadsInput,
  type LnReportLevel,
} from "@/lib/ln-rads-us";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";

const STEPS = [
  { id: 1, title: "Region & Size" },
  { id: 2, title: "Morphology" },
  { id: 3, title: "Doppler & Advanced" },
  { id: 4, title: "Result & Report" },
] as const;

function ChipField({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <CalcChip key={opt.value} label={opt.label} selected={value === opt.value} onClick={() => onChange(opt.value)} />
      ))}
    </div>
  );
}

export function LnRadsQuickWizard() {
  const { input, setInput, step, setStep } = useLnRadsFlow();
  const [pending, startTransition] = useTransition();
  const [reportLevel, setReportLevel] = useState<LnReportLevel>("standard");

  const setField = useCallback(
    <K extends keyof LnRadsInput>(key: K, value: LnRadsInput[K]) => {
      setInput((prev) => ({ ...prev, [key]: value }));
    },
    [setInput],
  );

  const engine = useMemo(() => enrichEngineResult(input), [input]);
  const report = useMemo(() => generateStructuredReport(input, { level: reportLevel }), [input, reportLevel]);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: `ln-rads-${engine.category}`,
        title: report.title,
        meta: [
          { label: "Ruleset", value: LN_RADS_VERSION },
          { label: "Category", value: `LN-RADS ${engine.category}` },
          { label: "Risk", value: engine.malignancyRisk },
        ],
        text: report.plainText,
      }),
    [engine.category, engine.malignancyRisk, report.plainText, report.title],
  );

  const save = () => {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "ln-rads",
        calculatorCode: "LN_RADS",
        payload: { input, report, engine: { category: engine.category, score: engine.score } },
        summary: `LN-RADS ${engine.category}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено");
        else toast.error(res.message);
      });
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={step === s.id ? "default" : "outline"}
            className="rounded-full text-xs"
            onClick={() => setStep(s.id)}
          >
            {s.id}. {s.title}
          </Button>
        ))}
      </div>

      {step === 1 ? (
        <CalcStepCard title="Anatomical region & size" required>
          <CalcSubLabel>Region</CalcSubLabel>
          <ChipField
            options={lnRadsOptions.region}
            value={input.region}
            onChange={(v) => setField("region", v as LnRadsInput["region"])}
          />
          <CalcSubLabel>Long axis / Short axis (mm)</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              value={input.longAxisMm}
              onChange={(e) => setField("longAxisMm", parseFloat(e.target.value) || 0)}
              className="w-28"
              placeholder="Long"
            />
            <Input
              type="number"
              value={input.shortAxisMm}
              onChange={(e) => setField("shortAxisMm", parseFloat(e.target.value) || 0)}
              className="w-28"
              placeholder="Short"
            />
          </div>
          {engine.sizeAnalysis.lsRatio !== null ? (
            <p className="text-sm">
              L/S = <strong>{engine.sizeAnalysis.lsRatio.toFixed(2)}</strong> — {engine.sizeAnalysis.interpretation}
            </p>
          ) : null}
          <CalcSubLabel>Cortex thickness (mm, optional)</CalcSubLabel>
          <Input
            type="number"
            value={input.cortexThicknessMm ?? ""}
            onChange={(e) => setField("cortexThicknessMm", parseFloat(e.target.value) || undefined)}
            className="w-28"
          />
        </CalcStepCard>
      ) : null}

      {step === 2 ? (
        <>
          <CalcStepCard title="Shape & capsule">
            <CalcSubLabel>Shape</CalcSubLabel>
            <ChipField options={lnRadsOptions.shape} value={input.shape} onChange={(v) => setField("shape", v as LnRadsInput["shape"])} />
            <CalcSubLabel>Capsule</CalcSubLabel>
            <ChipField options={lnRadsOptions.capsule} value={input.capsule} onChange={(v) => setField("capsule", v as LnRadsInput["capsule"])} />
          </CalcStepCard>
          <CalcStepCard title="Hilum, cortex, echogenicity, architecture">
            <CalcSubLabel>Hilum</CalcSubLabel>
            <ChipField options={lnRadsOptions.hilum} value={input.hilum} onChange={(v) => setField("hilum", v as LnRadsInput["hilum"])} />
            <CalcSubLabel>Cortex</CalcSubLabel>
            <ChipField options={lnRadsOptions.cortex} value={input.cortex} onChange={(v) => setField("cortex", v as LnRadsInput["cortex"])} />
            <CalcSubLabel>Echogenicity</CalcSubLabel>
            <ChipField
              options={lnRadsOptions.echogenicity}
              value={input.echogenicity}
              onChange={(v) => setField("echogenicity", v as LnRadsInput["echogenicity"])}
            />
            <CalcSubLabel>Architecture</CalcSubLabel>
            <ChipField
              options={lnRadsOptions.architecture}
              value={input.architecture}
              onChange={(v) => setField("architecture", v as LnRadsInput["architecture"])}
            />
          </CalcStepCard>
        </>
      ) : null}

      {step === 3 ? (
        <CalcStepCard title="Doppler & advanced features">
          <CalcSubLabel>Vascularity (CDS)</CalcSubLabel>
          <ChipField
            options={DOPPLER_OPTIONS}
            value={input.vascularity}
            onChange={(v) => setField("vascularity", v as LnRadsInput["vascularity"])}
          />
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{engine.dopplerAnalysis.teachingExplanation}</p>
          <CalcSubLabel>Calcifications</CalcSubLabel>
          <ChipField
            options={[
              { value: "none", label: "None" },
              { value: "microcalcifications", label: "Microcalcifications" },
              { value: "coarse", label: "Coarse" },
            ]}
            value={input.calcifications}
            onChange={(v) => setField("calcifications", v as LnRadsInput["calcifications"])}
          />
          <CalcSubLabel>Necrosis / Cystic / ECE / Matting</CalcSubLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["necrosis", ["absent", "partial", "extensive"]],
                ["cysticDegeneration", ["absent", "present"]],
                ["extracapsularExtension", ["no", "suspected", "definite"]],
                ["matting", ["absent", "present"]],
              ] as const
            ).map(([field, opts]) =>
              opts.map((o) => (
                <CalcChip
                  key={`${field}-${o}`}
                  label={`${field}: ${o}`}
                  selected={(input[field] as string) === o}
                  onClick={() => setField(field, o as never)}
                />
              )),
            )}
          </div>
          <CalcSubLabel>Elastography / CEUS</CalcSubLabel>
          <ChipField
            options={[
              { value: "not_assessed", label: "N/A" },
              { value: "soft", label: "Soft" },
              { value: "intermediate", label: "Intermediate" },
              { value: "stiff", label: "Stiff" },
            ]}
            value={input.elastography ?? "not_assessed"}
            onChange={(v) => setField("elastography", v as LnRadsInput["elastography"])}
          />
          <ChipField
            options={[
              { value: "not_assessed", label: "CEUS N/A" },
              { value: "homogeneous", label: "Homogeneous" },
              { value: "heterogeneous", label: "Heterogeneous" },
              { value: "peripheral", label: "Peripheral" },
              { value: "non_enhancing_necrosis", label: "Non-enhancing necrosis" },
            ]}
            value={input.ceus ?? "not_assessed"}
            onChange={(v) => setField("ceus", v as LnRadsInput["ceus"])}
          />
        </CalcStepCard>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <CalcStepCard title="LN-RADS Result">
            <div className="flex flex-wrap gap-2">
              <Badge className="text-base">LN-RADS {engine.category}</Badge>
              <Badge variant="outline">Score: {engine.score}</Badge>
              <Badge variant="outline">Risk: {engine.malignancyRisk}</Badge>
              {engine.biopsyRecommended ? <Badge variant="destructive">Biopsy recommended</Badge> : null}
            </div>
            <p className="mt-2 text-sm font-bold">{engine.title}</p>
            <p className="text-sm">{engine.management}</p>
            {engine.redFlags.length ? (
              <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-900">
                <p className="font-bold">Red flags:</p>
                <ul className="list-inside list-disc">{engine.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            ) : null}
            {engine.differential.mostLikely.length ? (
              <div className="mt-2">
                <p className="text-sm font-bold">Differential:</p>
                <p className="text-sm">{engine.differential.mostLikely.map((p) => p.nameRu).join(", ")}</p>
              </div>
            ) : null}
            <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{engine.decisionPath.join(" · ")}</p>
          </CalcStepCard>

          <CalcStepCard title="Structured report">
            <div className="mb-2 flex flex-wrap gap-2">
              {(["short", "standard", "expert"] as const).map((lvl) => (
                <CalcChip key={lvl} label={lvl} selected={reportLevel === lvl} onClick={() => setReportLevel(lvl)} />
              ))}
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{report.plainText}</pre>
            <DocumentExportToolbar spec={exportSpec} className="mt-3" />
            <Button type="button" className="mt-2" disabled={pending} onClick={save}>
              Сохранить в историю
            </Button>
          </CalcStepCard>
        </div>
      ) : null}

      <div className="flex justify-between pb-8">
        <Button type="button" variant="outline" disabled={step <= 1} onClick={() => setStep(step - 1)}>
          ← Back
        </Button>
        <Button type="button" disabled={step >= 4} onClick={() => setStep(step + 1)}>
          Next →
        </Button>
      </div>
    </div>
  );
}