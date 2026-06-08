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
  ENDOMETRIUM_SOURCE,
  assessThickness,
  buildEndometriumProtocol,
  defaultEndometriumInput,
  endometriumFormOptions,
  evaluateFocalLesionTactic,
  evaluateTamoxifenTactic,
  type EndometriumAssessmentInput,
} from "@/lib/endometrium";
import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { cn } from "@/lib/utils/cn";

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
        <CalcChip
          key={opt.value}
          label={opt.label}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

function levelBadgeClass(level: string) {
  if (level === "alert") return "border-red-400 bg-red-50 text-red-900";
  if (level === "watch") return "border-amber-400 bg-amber-50 text-amber-900";
  if (level === "ok") return "border-emerald-400 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-slate-50";
}

export function EndometriumCalculator() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<EndometriumAssessmentInput>({ ...defaultEndometriumInput });
  const [pending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof EndometriumAssessmentInput>(key: K, value: EndometriumAssessmentInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const thickness = useMemo(() => assessThickness(input), [input]);
  const focal = useMemo(() => evaluateFocalLesionTactic(input), [input]);
  const tam = useMemo(() => evaluateTamoxifenTactic(input), [input]);
  const reportText = useMemo(() => buildEndometriumProtocol(input), [input]);

  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: "endometrium-isuog",
        title: "Протокол · эндометрий ISUOG / КР РФ",
        meta: [{ label: "Источник", value: "ISUOG + КР РФ" }],
        text: reportText,
      }),
    [reportText],
  );

  function onSave() {
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "endometrium",
        calculatorCode: "ENDOMETRIUM_ISUOG",
        payload: { input, thickness, focal, tam, reportText },
        summary: `M-эхо ${thickness.effectiveMm ?? "—"} мм · ${focal.action}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Каталог</Link>
        </Button>
        <Badge variant="outline">ENDOMETRIUM · ISUOG</Badge>
        <Button variant="outline" size="sm" onClick={() => setInput({ ...defaultEndometriumInput })}>
          Сбросить
        </Button>
      </div>

      <header className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Эндометрий</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Измерение M-эхо, пороги постменопаузы / ЗГТ, очаговые образования и тамоксифен — по ISUOG и КР РФ.
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{ENDOMETRIUM_SOURCE}</p>
      </header>

      <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
        {[1, 2, 3, 4].map((n) => (
          <Button key={n} size="sm" variant={step === n ? "default" : "outline"} onClick={() => setStep(n)}>
            {n === 1 ? "Измерение" : n === 2 ? "Контекст" : n === 3 ? "Очаг / СМЭР" : "Протокол"}
          </Button>
        ))}
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {step === 1 && (
          <>
            <CalcStepCard title="Толщина эндометрия (M-эхо)">
              <CalcSubLabel>Двойной слой, мм (округление 0,1)</CalcSubLabel>
              <Input
                inputMode="decimal"
                placeholder="например 8.4"
                value={input.thicknessMm ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setField("thicknessMm", Number.isFinite(v) ? v : undefined);
                }}
              />
              <CalcSubLabel>Жидкость в полости</CalcSubLabel>
              <ChipField
                options={endometriumFormOptions.fluidInCavity}
                value={input.fluidInCavity}
                onChange={(v) => setField("fluidInCavity", v as EndometriumAssessmentInput["fluidInCavity"])}
              />
              {input.fluidInCavity !== "none" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">
                    Передний слой (мм)
                    <Input
                      className="mt-1"
                      inputMode="decimal"
                      value={input.layer1Mm ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setField("layer1Mm", Number.isFinite(v) ? v : undefined);
                      }}
                    />
                  </label>
                  <label className="text-xs">
                    Задний слой (мм)
                    <Input
                      className="mt-1"
                      inputMode="decimal"
                      value={input.layer2Mm ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setField("layer2Mm", Number.isFinite(v) ? v : undefined);
                      }}
                    />
                  </label>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.focalLesionPresent}
                  onChange={(e) => setField("focalLesionPresent", e.target.checked)}
                />
                Внутриматочное образование в сагиттали
              </label>
              {input.focalLesionPresent && (
                <Input
                  inputMode="decimal"
                  placeholder="Диаметр образования в сагиттали, мм"
                  value={input.focalLesionDiameterMm ?? ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setField("focalLesionDiameterMm", Number.isFinite(v) ? v : undefined);
                  }}
                />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.intracavitaryMyomaPresent}
                  onChange={(e) => setField("intracavitaryMyomaPresent", e.target.checked)}
                />
                Внутриматочная миома (не в толщину)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!input.structureHomogeneous}
                  onChange={(e) => setField("structureHomogeneous", !e.target.checked)}
                />
                Неоднородная структура
              </label>
            </CalcStepCard>
            <Button onClick={() => setStep(2)}>Далее → контекст</Button>
          </>
        )}

        {step === 2 && (
          <>
            <CalcStepCard title="Контекст пациентки">
              <ChipField
                options={endometriumFormOptions.patientContext}
                value={input.patientContext}
                onChange={(v) => setField("patientContext", v as EndometriumAssessmentInput["patientContext"])}
              />
              <CalcSubLabel>ВМС</CalcSubLabel>
              <ChipField
                options={endometriumFormOptions.iudType}
                value={input.iudType}
                onChange={(v) => setField("iudType", v as EndometriumAssessmentInput["iudType"])}
              />
              <label className="text-xs">
                День цикла (пременопауза)
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  value={input.cycleDay ?? ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setField("cycleDay", Number.isFinite(v) ? v : undefined);
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={input.aubPresent} onChange={(e) => setField("aubPresent", e.target.checked)} />
                AUB (аномальное маточное кровотечение)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.onTamoxifen}
                  onChange={(e) => {
                    setField("onTamoxifen", e.target.checked);
                    if (e.target.checked) setField("patientContext", "on_tamoxifen");
                  }}
                />
                Тамоксифен (СМЭР)
              </label>
            </CalcStepCard>
            <div className={cn("rounded-xl border p-4 text-sm", levelBadgeClass(thickness.level))}>
              <p className="font-bold">
                M-эхо: {thickness.effectiveMm != null ? `${thickness.effectiveMm} мм` : "—"} · {thickness.level}
              </p>
              <p className="mt-2">{thickness.isuogNote}</p>
              {thickness.krRfNote ? <p className="mt-1">{thickness.krRfNote}</p> : null}
              {thickness.ecRiskHint ? <p className="mt-1 text-xs">{thickness.ecRiskHint}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Назад
              </Button>
              <Button onClick={() => setStep(3)}>Очаг / тамоксифен →</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <CalcStepCard title="Очаговое образование (без AUB)">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.multipleVesselsIrregular ?? false}
                  onChange={(e) => setField("multipleVesselsIrregular", e.target.checked)}
                />
                Множественные сосуды, нерегулярное ветвление
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.multipleVesselsNoBranching ?? false}
                  onChange={(e) => setField("multipleVesselsNoBranching", e.target.checked)}
                />
                Множественные сосуды без ветвления
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.unevenContour ?? false}
                  onChange={(e) => setField("unevenContour", e.target.checked)}
                />
                Неровный контур
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.riskFactorsPresent ?? false}
                  onChange={(e) => setField("riskFactorsPresent", e.target.checked)}
                />
                Факторы риска
              </label>
              <p className="rounded-lg bg-violet-50 p-3 text-xs dark:bg-violet-950/30">
                <strong>Тактика:</strong> {focal.action}. {focal.rationale}
              </p>
            </CalcStepCard>

            {input.onTamoxifen && (
              <CalcStepCard title="Тамоксифен + AUB">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={input.tamoxifenThinHomogeneous ?? false}
                    onChange={(e) => setField("tamoxifenThinHomogeneous", e.target.checked)}
                  />
                  Тонкий однородный эндометрий
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={input.tamoxifenThickenedInhomogeneous ?? false}
                    onChange={(e) => setField("tamoxifenThickenedInhomogeneous", e.target.checked)}
                  />
                  Утолщён / неоднороден → СГС
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={input.sonoThickenedDiffuse ?? false}
                    onChange={(e) => setField("sonoThickenedDiffuse", e.target.checked)}
                  />
                  После СГС: диффузное утолщение
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={input.sonoFocalChanges ?? false}
                    onChange={(e) => setField("sonoFocalChanges", e.target.checked)}
                  />
                  После СГС: очаговые изменения
                </label>
                <p className="text-xs">
                  <strong>СМЭР:</strong> {tam.action}. {tam.rationale}
                </p>
              </CalcStepCard>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Назад
              </Button>
              <Button onClick={() => setStep(4)}>Протокол →</Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <CalcStepCard title="Заключение врача">
              <Textarea
                rows={4}
                placeholder="Ваш текст заключения…"
                value={input.conclusionDraft ?? ""}
                onChange={(e) => setField("conclusionDraft", e.target.value)}
              />
            </CalcStepCard>
            <pre className="clinical-pre max-h-96 overflow-auto rounded-xl p-4 text-xs whitespace-pre-wrap">
              {reportText}
            </pre>
            <DocumentExportToolbar spec={exportSpec} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                ← Назад
              </Button>
              <Button disabled={pending} onClick={onSave}>
                {pending ? "Сохранение…" : "Сохранить в историю"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
