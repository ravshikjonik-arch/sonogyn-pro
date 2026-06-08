"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Control, UseFieldArrayReturn } from "react-hook-form";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

import { AnatomicalDiagram } from "./anatomical-diagram";
import { FindingToggle } from "./finding-toggle";
import { IdeaStepper } from "./idea-stepper";
import { LocationSelector } from "./location-selector";
import { PerformancePanel } from "./performance-panel";
import { ReportPreview } from "./report-preview";
import { SeverityBadge } from "./severity-badge";
import { getDefaultIdeaFormValues } from "../lib/default-values";
import { examinationToFhirBundle } from "../lib/fhir-export";
import { t } from "../lib/messages";
import { getMockIdeaExamination } from "../lib/mock-examination";
import { clearIdeaDraft, createDebouncedIdeaSaver, loadIdeaDraft } from "../lib/persist";
import { buildIdeaReport, mergeImpression } from "../lib/report-engine";
import {
  cystCharacteristicSchema,
  getStepSchema,
  ideaExaminationPayloadSchema,
  ideaFormSchema,
  type IdeaFormValues,
  type IdeaStepIndex,
  pickStepValues,
} from "../lib/schema";

const MOCK_PATIENTS = [
  { id: "PX-1001", label: "Амбулаторный список (демо)", age: 32 },
  { id: "PX-1002", label: "Операционный график (демо)", age: 28 },
];

const SLIDING_OPTIONS = [
  { value: "present", label: "Сохранён" },
  { value: "absent", label: "Отсутствует" },
  { value: "reduced", label: "Снижен" },
] as const;

const CYST_LABELS: Record<string, string> = {
  unilocular: "унилокулярная",
  multilocular: "мультилокулярная",
  ground_glass: "«матовое стекло»",
};

const CYST_OPTS = cystCharacteristicSchema.options;

function fieldClass() {
  return "rounded-lg border border-[var(--clinical-border)] bg-white px-2 py-2 text-sm shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-ring)]";
}

export function IdeaWorkspace() {
  const [active, setActive] = useState<IdeaStepIndex>(0);
  const [stepError, setStepError] = useState<Partial<Record<IdeaStepIndex, boolean>>>({});
  const [exportBusy, setExportBusy] = useState(false);

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: getDefaultIdeaFormValues(),
    mode: "onChange",
  });

  const { control, handleSubmit, reset, setValue, getValues, formState } = form;
  const watched = useWatch({ control });
  const manualImpression = useWatch({ control, name: "impressionManualOverride" });
  const debouncedSave = useMemo(() => createDebouncedIdeaSaver(), []);

  const nodules = useFieldArray({ control, name: "step4.nodules" });

  useEffect(() => {
    const draft = loadIdeaDraft();
    reset(draft ?? getDefaultIdeaFormValues());
  }, [reset]);

  useEffect(() => {
    const parsed = ideaFormSchema.safeParse(watched);
    if (parsed.success) debouncedSave(parsed.data);
  }, [watched, debouncedSave]);

  const report = useMemo(() => {
    const parsed = ideaFormSchema.safeParse(watched);
    const data = parsed.success ? parsed.data : getDefaultIdeaFormValues();
    return buildIdeaReport(data);
  }, [watched]);

  const impressionText = mergeImpression(report.impressionAuto, manualImpression ?? "");

  const completion = useMemo(() => {
    let ok = 0;
    for (let i = 0; i < 4; i++) {
      const step = i as IdeaStepIndex;
      const vals = getValues();
      const res = getStepSchema(step).safeParse(pickStepValues(vals, step));
      if (res.success) ok += 1;
    }
    return Math.round((ok / 4) * 100);
  }, [watched, getValues]);

  const stepperModel = useMemo(() => {
    const vals = getValues();
    return ([0, 1, 2, 3] as const).map((idx) => {
      const res = getStepSchema(idx).safeParse(pickStepValues(vals, idx));
      return {
        index: idx,
        label: [t("stepper.step1"), t("stepper.step2"), t("stepper.step3"), t("stepper.step4")][idx],
        complete: res.success,
        error: Boolean(stepError[idx]),
      };
    });
  }, [watched, getValues, stepError]);

  const validateActiveStep = useCallback((): boolean => {
    const vals = getValues();
    const res = getStepSchema(active).safeParse(pickStepValues(vals, active));
    if (!res.success) {
      setStepError((s) => ({ ...s, [active]: true }));
      toast.error("Исправьте поля с ошибками перед переходом к следующему шагу.");
      return false;
    }
    setStepError((s) => ({ ...s, [active]: false }));
    return true;
  }, [active, getValues]);

  function goNext() {
    if (!validateActiveStep()) return;
    setActive((s) => (s < 3 ? ((s + 1) as IdeaStepIndex) : s));
  }

  function goBack() {
    setActive((s) => (s > 0 ? ((s - 1) as IdeaStepIndex) : s));
  }

  async function onExportPdf() {
    setExportBusy(true);
    try {
      const data = getValues();
      const rep = buildIdeaReport(data);
      const impression = mergeImpression(rep.impressionAuto, data.impressionManualOverride);
      const [{ pdf }, mod] = await Promise.all([import("@react-pdf/renderer"), import("../pdf/idea-report-document")]);
      const blob = await pdf(mod.IdeaReportDocument({ data, report: rep, impressionDisplay: impression })).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IDEA-report-${data.examDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF сохранён.");
    } catch {
      toast.error("Не удалось сформировать PDF.");
    } finally {
      setExportBusy(false);
    }
  }

  function onExportJson() {
    const data = getValues();
    const payload = {
      ...data,
      metadata: { version: "1.0" as const, schema: "idea-deep-endometriosis" as const },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IDEA-exam-${data.examDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON сохранён.");
  }

  async function onCopyJson() {
    const data = getValues();
    const payload = {
      ...data,
      metadata: { version: "1.0" as const, schema: "idea-deep-endometriosis" as const },
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("JSON скопирован в буфер.");
  }

  function onCopyFhir() {
    const data = getValues();
    const payload = {
      ...data,
      metadata: { version: "1.0" as const, schema: "idea-deep-endometriosis" as const },
    };
    const parsed = ideaExaminationPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Форма не прошла проверку — FHIR не сформирован.");
      return;
    }
    const bundle = examinationToFhirBundle(parsed.data);
    void navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    toast.success("FHIR Bundle скопирован в буфер.");
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">{t("clinical.module")}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("idea.title")}</h1>
        <p className="max-w-3xl text-sm text-[var(--clinical-foreground-muted)]">{t("idea.subtitle")}</p>
        <p className="max-w-3xl text-xs text-amber-900 dark:text-amber-200">{t("idea.disclaimer")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-2">
          <Card className="border-[var(--clinical-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Пациенты (демо)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {MOCK_PATIENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full rounded-lg border border-transparent px-2 py-2 text-left hover:border-[var(--clinical-border)]"
                  onClick={() => {
                    setValue("patientId", p.id);
                    toast.message(`Выбран пациент ${p.id}`);
                  }}
                >
                  <p className="font-semibold">{p.id}</p>
                  <p className="text-xs text-[var(--clinical-foreground-muted)]">{p.label}</p>
                </button>
              ))}
            </CardContent>
          </Card>
          <PerformancePanel />
        </aside>

        <section className="space-y-4 lg:col-span-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <IdeaStepper steps={stepperModel} active={active} onSelect={setActive} />
            </div>
            <div className="md:hidden">
              <label className="text-xs font-semibold text-[var(--clinical-foreground-muted)]" htmlFor="idea-step-mob">
                Шаг
              </label>
              <select
                id="idea-step-mob"
                className={cn("mt-1 w-full", fieldClass())}
                value={active}
                onChange={(e) => setActive(Number(e.target.value) as IdeaStepIndex)}
              >
                <option value={0}>{t("stepper.step1")}</option>
                <option value={1}>{t("stepper.step2")}</option>
                <option value={2}>{t("stepper.step3")}</option>
                <option value={3}>{t("stepper.step4")}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--clinical-foreground-muted)]">
              <span>Заполнение</span>
              <span>{completion}%</span>
            </div>
            <Progress value={completion} />
          </div>

          <Card className="border-[var(--clinical-border)]">
            <CardContent className="space-y-6 p-6">
              {active === 0 ? (
                <Step1 control={control} />
              ) : active === 1 ? (
                <Step2 control={control} />
              ) : active === 2 ? (
                <Step3 control={control} />
              ) : (
                <Step4 control={control} nodules={nodules} />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={goBack} disabled={active === 0} variant="secondary">
              {t("actions.back")}
            </Button>
            <Button type="button" onClick={goNext} disabled={active === 3}>
              {t("actions.next")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                reset(getMockIdeaExamination());
                toast.success("Демо-кейс загружен.");
              }}
              variant="secondary"
            >
              {t("actions.loadDemo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearIdeaDraft();
                reset(getDefaultIdeaFormValues());
                toast.message("Черновик очищен.");
              }}
            >
              {t("actions.clearDraft")}
            </Button>
          </div>

          <Card className="border-[var(--clinical-border)]">
            <CardHeader>
              <CardTitle className="text-base">Ручное заключение</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="impressionManualOverride"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    rows={5}
                    placeholder="Необязательно: свой текст заключения (заменит автоматический, если заполнено)"
                  />
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 border-t border-[var(--clinical-border)] pt-4">
            <Button type="button" onClick={onExportJson} variant="secondary">
              {t("export.json")}
            </Button>
            <Button type="button" onClick={() => void onCopyJson()} variant="secondary">
              {t("export.clipboard")}
            </Button>
            <Button type="button" onClick={onCopyFhir} variant="secondary">
              {t("export.fhir")}
            </Button>
            <Button type="button" onClick={() => void onExportPdf()} disabled={exportBusy}>
              {exportBusy ? "…" : t("export.pdf")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(() => toast.success("Форма проверена — можно сохранять в систему."))}
              disabled={!formState.isValid}
            >
              {t("actions.generate")}
            </Button>
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-3">
          <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">{t("live.preview")}</p>
            <ReportPreview report={report} impressionDisplay={impressionText} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step1({ control }: { control: Control<IdeaFormValues> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold">ID пациента</label>
          <Controller name="patientId" control={control} render={({ field }) => <Input className="mt-1" {...field} />} />
        </div>
        <div>
          <label className="text-xs font-semibold">Дата исследования</label>
          <Controller name="examDate" control={control} render={({ field }) => <Input type="date" className="mt-1" {...field} />} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">Врач / исследователь (ID)</label>
          <Controller name="sonographerId" control={control} render={({ field }) => <Input className="mt-1" {...field} />} />
        </div>
      </div>
      <fieldset className="space-y-3 rounded-xl border border-[var(--clinical-border)] p-4">
        <legend className="text-sm font-semibold">Матка</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold">Положение</label>
            <Controller
              name="step1.uterus.position"
              control={control}
              render={({ field }) => (
                <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                  <option value="anteverted">Антеверсия</option>
                  <option value="retroverted">Ретроверсия</option>
                  <option value="mid">Среднее</option>
                </select>
              )}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Размер</label>
            <Controller
              name="step1.uterus.size"
              control={control}
              render={({ field }) => (
                <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                  <option value="normal">Норма</option>
                  <option value="enlarged">Увеличена</option>
                </select>
              )}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Миометрий</label>
            <Controller
              name="step1.uterus.myometrium"
              control={control}
              render={({ field }) => (
                <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                  <option value="homogeneous">Однородный</option>
                  <option value="heterogeneous">Неоднородный</option>
                </select>
              )}
            />
          </div>
        </div>
        <Controller
          name="step1.uterus.adenomyosisSuspicion"
          control={control}
          render={({ field }) => (
            <FindingToggle label="Подозрение на аденомиоз" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </fieldset>
      {(["adnexaRight", "adnexaLeft"] as const).map((side) => (
        <fieldset key={side} className="space-y-3 rounded-xl border border-[var(--clinical-border)] p-4">
          <legend className="text-sm font-semibold">{side === "adnexaRight" ? "Придатки справа" : "Придатки слева"}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Визуализация яичника</label>
              <Controller
                name={`step1.${side}.ovaryVisibility`}
                control={control}
                render={({ field }) => (
                  <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                    <option value="visible">Визуализируется</option>
                    <option value="not_visualized">Не визуализируется</option>
                    <option value="partial">Частично</option>
                  </select>
                )}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Размер яичника</label>
              <Controller
                name={`step1.${side}.ovarySize`}
                control={control}
                render={({ field }) => (
                  <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                    <option value="normal">Норма</option>
                    <option value="enlarged">Увеличен</option>
                  </select>
                )}
              />
            </div>
            <Controller
              name={`step1.${side}.endometriomaPresent`}
              control={control}
              render={({ field }) => (
                <FindingToggle label="Эндометриома" checked={field.value} onCheckedChange={field.onChange} className="sm:col-span-2" />
              )}
            />
          </div>
          <div>
            <p className="text-xs font-semibold">Характеристики кисты</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {CYST_OPTS.map((opt) => (
                <Controller
                  key={opt}
                  name={`step1.${side}.cystCharacteristics`}
                  control={control}
                  render={({ field }) => {
                    const set = new Set(field.value);
                    const checked = set.has(opt);
                    return (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = new Set(field.value);
                            if (v === true) next.add(opt);
                            else next.delete(opt);
                            field.onChange([...next]);
                          }}
                        />
                        {CYST_LABELS[opt] ?? opt}
                      </label>
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </fieldset>
      ))}
      <div>
        <label className="text-xs font-semibold">Комментарий (до 500 символов)</label>
        <Controller name="step1.freeTextComment" control={control} render={({ field }) => <Textarea className="mt-1" {...field} />} />
      </div>
    </div>
  );
}

function Step2({ control }: { control: Control<IdeaFormValues> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name="step2.softMarkers.tendernessOnProbePalpation"
          control={control}
          render={({ field }) => (
            <FindingToggle label="Болезненность при пальпации датчиком" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Controller
          name="step2.softMarkers.fixedOvaries"
          control={control}
          render={({ field }) => <FindingToggle label="Фиксированные яичники" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Controller
          name="step2.softMarkers.peritonealFluid"
          control={control}
          render={({ field }) => <FindingToggle label="Свободная жидкость в малом тазу" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["ovarianMobilityRight", "ovarianMobilityLeft"] as const).map((name) => (
          <div key={name}>
            <label className="text-xs font-semibold">
              {name === "ovarianMobilityRight" ? "Подвижность яичника справа" : "Подвижность яичника слева"}
            </label>
            <Controller
              name={`step2.${name}`}
              control={control}
              render={({ field }) => (
                <select className={cn("mt-1 w-full", fieldClass())} {...field}>
                  <option value="mobile">Подвижна</option>
                  <option value="reduced_mobility">Снижена подвижность</option>
                  <option value="fixed">Фиксирована</option>
                </select>
              )}
            />
          </div>
        ))}
      </div>
      <fieldset className="space-y-4 rounded-xl border border-[var(--clinical-border)] p-4">
        <legend className="text-sm font-semibold">Болезненность по локализациям</legend>
        {(
          [
            ["pouchOfDouglas", "Позадиматочное пространство (Дуглас)"],
            ["uterosacralRight", "Крестцово-маточная связка справа"],
            ["uterosacralLeft", "Крестцово-маточная связка слева"],
            ["bladderBase", "Дно мочевого пузыря"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex flex-col gap-2 rounded-lg border border-[var(--clinical-border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <Controller
              name={`step2.siteTenderness.${key}.present`}
              control={control}
              render={({ field }) => <FindingToggle label={label} checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Controller
              name={`step2.siteTenderness.${key}.severity`}
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap items-center gap-2">
                  {field.value ? <SeverityBadge severity={field.value} /> : null}
                  <select
                    className={cn("min-h-[44px] min-w-[140px]", fieldClass())}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                    aria-label={`${label} — степень`}
                  >
                    <option value="">Степень (необязательно)</option>
                    <option value="mild">Лёгкая</option>
                    <option value="moderate">Умеренная</option>
                    <option value="severe">Выраженная</option>
                  </select>
                </div>
              )}
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function Step3({ control }: { control: Control<IdeaFormValues> }) {
  return (
    <div className="space-y-6">
      {(
        [
          ["anteriorCompartment", "Передний отдел (матка — мочевой пузырь)"],
          ["posteriorCompartment", "Задний отдел (матка — прямая кишка)"],
          ["rightOvarianFossa", "Правая яичниковая ямка"],
          ["leftOvarianFossa", "Левая яичниковая ямка"],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <p className="text-sm font-semibold">{label}</p>
          <Controller
            name={`step3.slidingSign.${key}`}
            control={control}
            render={({ field }) => (
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                {SLIDING_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === o.value}
                    className={cn(
                      "min-h-[44px] rounded-full border px-4 text-sm font-medium transition",
                      field.value === o.value
                        ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                        : "border-[var(--clinical-border)] bg-white",
                    )}
                    onClick={() => field.onChange(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      ))}
      <Controller
        name="step3.diagramSelectedRegionIds"
        control={control}
        render={({ field }) => (
          <AnatomicalDiagram selectedIds={field.value} onChange={field.onChange} testId="idea-sliding-diagram" />
        )}
      />
    </div>
  );
}

function Step4({
  control,
  nodules,
}: {
  control: Control<IdeaFormValues>;
  nodules: UseFieldArrayReturn<IdeaFormValues, "step4.nodules">;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Глубокие узлы (до 6)</p>
        <Button
          type="button"
          variant="secondary"
          disabled={nodules.fields.length >= 6}
          onClick={() =>
            nodules.append({
              id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}`,
              location: "rectovaginal_septum",
              sizeLengthMm: 10,
              sizeWidthMm: 8,
              sizeHeightMm: 6,
              depthOfInfiltration: "superficial",
              shape: "nodular",
              associatedTenderness: false,
              vascularizationDoppler: "minimal",
            })
          }
        >
          Добавить узел
        </Button>
      </div>
      <div className="space-y-6">
        {nodules.fields.map((field, index) => (
          <Card key={field.id} className="border-[var(--clinical-border)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Узел №{index + 1}</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={() => nodules.remove(index)}>
                Удалить
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold">Локализация</label>
                <Controller
                  name={`step4.nodules.${index}.location`}
                  control={control}
                  render={({ field: f }) => <LocationSelector value={f.value} onChange={f.onChange} testId={`nodule-${index}-loc`} />}
                />
              </div>
              {(
                [
                  ["sizeLengthMm", "Длина (мм)"],
                  ["sizeWidthMm", "Ширина (мм)"],
                  ["sizeHeightMm", "Высота (мм)"],
                ] as const
              ).map(([dim, dimLabel]) => (
                <div key={dim}>
                  <label className="text-xs font-semibold">{dimLabel}</label>
                  <Controller
                    name={`step4.nodules.${index}.${dim}`}
                    control={control}
                    render={({ field: f }) => <Input type="number" className="mt-1" {...f} onChange={(e) => f.onChange(Number(e.target.value))} />}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold">Глубина инфильтрации</label>
                <Controller
                  name={`step4.nodules.${index}.depthOfInfiltration`}
                  control={control}
                  render={({ field: f }) => (
                    <select className={cn("mt-1 w-full", fieldClass())} {...f}>
                      <option value="superficial">Поверхностная / субсерозная</option>
                      <option value="muscular">Мышечный слой</option>
                      <option value="submucosal">Субмукозная</option>
                    </select>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Форма</label>
                <Controller
                  name={`step4.nodules.${index}.shape`}
                  control={control}
                  render={({ field: f }) => (
                    <select className={cn("mt-1 w-full", fieldClass())} {...f}>
                      <option value="nodular">Узелковая</option>
                      <option value="plaque">Бляшкообразная</option>
                      <option value="stellate">Звёздчатая</option>
                    </select>
                  )}
                />
              </div>
              <Controller
                name={`step4.nodules.${index}.associatedTenderness`}
                control={control}
                render={({ field: f }) => (
                  <FindingToggle label="Сопутствующая болезненность" checked={f.value} onCheckedChange={f.onChange} />
                )}
              />
              <div>
                <label className="text-xs font-semibold">Васкуляризация по Допплеру</label>
                <Controller
                  name={`step4.nodules.${index}.vascularizationDoppler`}
                  control={control}
                  render={({ field: f }) => (
                    <select className={cn("mt-1 w-full", fieldClass())} {...f}>
                      <option value="minimal">Минимальная</option>
                      <option value="moderate">Умеренная</option>
                      <option value="abundant">Выраженная</option>
                    </select>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Шкала Penelope (необязательно)</label>
                <Controller
                  name={`step4.nodules.${index}.penelopeScore`}
                  control={control}
                  render={({ field: f }) => (
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      className="mt-1"
                      value={f.value ?? ""}
                      onChange={(e) => f.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
