"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import {
  ANNOTATION_COLOR_LABELS,
  ColposcopyCervixDiagram,
  type AnnotationColor,
  type CervixAnnotation,
} from "@/components/calculators/colposcopy/ColposcopyCervixDiagram";
import { ColposcopyExportPanel } from "@/components/calculators/colposcopy/ColposcopyExportPanel";
import {
  ColposcopyHistoryPanel,
  loadColposcopyHistory,
  saveColposcopyHistory,
} from "@/components/calculators/colposcopy/ColposcopyHistoryPanel";
import { ColposcopyProtocolSection } from "@/components/calculators/colposcopy/ColposcopyProtocolSection";
import { ColposcopyResultPanel } from "@/components/calculators/colposcopy/ColposcopyResultPanel";
import { SwedeScoreForm } from "@/components/calculators/colposcopy/SwedeScoreForm";
import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Button } from "@/components/ui/button";
import {
  buildColposcopyPatientText,
  buildColposcopyProtocolText,
  calculateSwedeScore,
  DEFAULT_PROTOCOL_INPUT,
  DEFAULT_SWEDE_INPUT,
  mapProtocolToSwedeHints,
  SWEDE_SOURCE,
  swedeScoreOneLiner,
  type ColposcopyProtocolInput,
  type ColposcopySession,
  type SwedeScoreInput,
} from "@/lib/colposcopy";
import {
  downloadClinicalPdf,
  openClinicalEmail,
} from "@/lib/reporting/clinical-document-export";
import { buildColposcopyDocumentBundle, riskBannerClass } from "@/lib/colposcopy/build-document-specs";
import { cn } from "@/lib/utils/cn";

export function ColposcopyFlow() {
  const [pending, startTransition] = useTransition();
  const [protocol, setProtocol] = useState<ColposcopyProtocolInput>(() => DEFAULT_PROTOCOL_INPUT());
  const [swede, setSwede] = useState<SwedeScoreInput>(() => DEFAULT_SWEDE_INPUT());
  const [calculated, setCalculated] = useState(false);
  const [annotations, setAnnotations] = useState<CervixAnnotation[]>([]);
  const [annotationColor, setAnnotationColor] = useState<AnnotationColor>("green");

  useEffect(() => {
    void fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: { full_name?: string | null; institution?: string | null } } | null) => {
        if (!data?.profile) return;
        setProtocol((p) => ({
          ...p,
          physicianName: data.profile?.full_name?.trim() ?? p.physicianName,
          institution: data.profile?.institution?.trim() ?? p.institution,
        }));
      })
      .catch(() => {});
  }, []);

  const result = useMemo(() => calculateSwedeScore(swede), [swede]);

  const clinicalText = useMemo(
    () => (calculated ? buildColposcopyProtocolText({ protocol, swede, result }) : ""),
    [calculated, protocol, swede, result],
  );

  const patientText = useMemo(
    () => (calculated ? buildColposcopyPatientText({ protocol, result }) : ""),
    [calculated, protocol, result],
  );

  const documentBundle = useMemo(
    () =>
      calculated
        ? buildColposcopyDocumentBundle({
            protocol,
            result,
            clinicalText,
            patientText,
            conclusionText: clinicalText,
          })
        : null,
    [calculated, protocol, result, clinicalText, patientText],
  );

  function patchProtocol(patch: Partial<ColposcopyProtocolInput>) {
    setProtocol((p) => ({ ...p, ...patch }));
    setCalculated(false);
  }

  function patchSwede(key: keyof SwedeScoreInput, level: SwedeScoreInput[typeof key]) {
    setSwede((s) => ({ ...s, [key]: level }));
    setCalculated(false);
  }

  function syncFromProtocol() {
    const hints = mapProtocolToSwedeHints(protocol);
    setSwede((s) => ({ ...s, ...hints }));
    toast.success("Swede Score подставлен из бланка");
  }

  function handleCalculate() {
    setCalculated(true);
    toast.success(`Swede Score ${result.total} — ${result.riskLabel}`);
  }

  function handleAnnotate(x: number, y: number) {
    setAnnotations((a) => [...a, { x, y, color: annotationColor }]);
  }

  function saveHistory() {
    const session: ColposcopySession = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      protocol,
      swede,
      swedeResult: result,
      conclusionText: clinicalText,
    };
    const items = [session, ...loadColposcopyHistory()].slice(0, 50);
    saveColposcopyHistory(items);
    toast.success("Сохранено в локальную историю");
  }

  function loadSession(session: ColposcopySession) {
    setProtocol(session.protocol);
    setSwede(session.swede);
    setCalculated(true);
    toast.success("Осмотр загружен");
  }

  function saveToServer() {
    if (!calculated) {
      toast.error("Сначала рассчитайте Swede Score");
      return;
    }
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "colposcopy",
        calculatorCode: "COLOPOSCOPY_SWEDE",
        payload: { protocol, swede, result, annotations },
        summary: swedeScoreOneLiner(result),
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории SonoGyn");
        else toast.error(res.message);
      });
    });
  }

  function copyOneLiner() {
    void navigator.clipboard.writeText(swedeScoreOneLiner(result)).then(() => toast.success("Строка скопирована"));
  }

  return (
    <div className="space-y-4 px-4 py-4 pb-44 lg:px-10">
      <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-violet-900 to-fuchsia-700 px-2 py-3 text-white lg:px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <div>
            <p className="text-base font-bold">Кольпоскопия · Swede Score</p>
            <p className="text-xs text-violet-100">Протокол по стандартному бланку + оценка риска CIN 2+</p>
          </div>
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/tools/calc/gyn/cervical-intelligence">CPI CDS →</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 rounded-full text-xs">
            <Link href="/tools/calc/gyn/cin-risk">CIN Risk →</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="ml-auto h-8 rounded-full text-xs">
            <Link href="/tools/calc">← Калькуляторы</Link>
          </Button>
        </div>
      </div>

      <p className="mx-auto max-w-5xl text-xs text-[var(--clinical-foreground-muted)]">{SWEDE_SOURCE}</p>

      <div className="mx-auto flex max-w-5xl justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setProtocol(DEFAULT_PROTOCOL_INPUT());
            setSwede(DEFAULT_SWEDE_INPUT());
            setCalculated(false);
            setAnnotations([]);
            toast.success("Форма сброшена");
          }}
        >
          Сбросить всё
        </Button>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <CalcStepCard title="Схема шейки · отметка зон">
            <div className="mb-2 flex flex-wrap gap-2">
              {(Object.keys(ANNOTATION_COLOR_LABELS) as AnnotationColor[]).map((c) => (
                <CalcChip
                  key={c}
                  label={ANNOTATION_COLOR_LABELS[c]}
                  selected={annotationColor === c}
                  onClick={() => setAnnotationColor(c)}
                />
              ))}
              <CalcChip label="Очистить зоны" selected={false} onClick={() => setAnnotations([])} />
            </div>
            <ColposcopyCervixDiagram
              swede={swede}
              annotations={annotations}
              annotationColor={annotationColor}
              onAnnotate={handleAnnotate}
            />
          </CalcStepCard>

          <ColposcopyHistoryPanel onLoad={loadSession} />

          <CalcStepCard title="Справка · Swede Score">
            <ul className="space-y-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
              <li>0–4 балла — низкий риск, наблюдение 6–12 мес.</li>
              <li>5–7 баллов — умеренный риск, биопсия под кольпоскопией.</li>
              <li>8–10 баллов — высокий риск CIN 2+, биопсия + гистология.</li>
            </ul>
            <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">
              Не диагноз. Тактика — по КР, цитологии, HPV и гистологии.
            </p>
          </CalcStepCard>
        </div>

        <div className="space-y-3">
          <ColposcopyProtocolSection value={protocol} onChange={patchProtocol} />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={syncFromProtocol}>
              Из бланка → Swede
            </Button>
          </div>

          <SwedeScoreForm value={swede} onChange={patchSwede} />

          <Button type="button" size="lg" className="w-full rounded-xl font-bold" onClick={handleCalculate}>
            Рассчитать Swede Score
          </Button>

          <ColposcopyResultPanel result={result} calculated={calculated} />

          <ColposcopyExportPanel
            protocol={protocol}
            swede={swede}
            result={result}
            clinicalText={clinicalText}
            patientText={patientText}
            calculated={calculated}
            onSaveHistory={saveHistory}
          />

          {calculated ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={pending} onClick={saveToServer}>
                Сохранить в истории SonoGyn
              </Button>
              <Button type="button" variant="outline" onClick={copyOneLiner}>
                Строка в протокол
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {calculated ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t-2 p-3 shadow-2xl lg:left-64",
            riskBannerClass(result.riskLevel),
          )}
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black">
                Swede {result.total}/10 · {result.riskLabel}
              </p>
              <p className="truncate text-xs text-[var(--clinical-foreground-muted)]">
                {swedeScoreOneLiner(result)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => documentBundle && void downloadClinicalPdf(documentBundle.clinicalSpec)}
              >
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => documentBundle && openClinicalEmail(documentBundle.clinicalSpec)}
              >
                Почта
              </Button>
              <Button type="button" size="lg" className="rounded-full font-bold" onClick={copyOneLiner}>
                В протокол
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
