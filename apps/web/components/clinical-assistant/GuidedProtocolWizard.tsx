"use client";

import {
  completeness,
  emptyT1Fields,
  emptyT2Fields,
  isT1Window,
  renderProtocolText,
  resolveGuidedProtocol,
  type GuidedFields,
  type GuidedStep,
  type GuidedT1Fields,
  type GuidedT2Fields,
} from "@repo/prenatal-guided-protocol";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DictationField } from "@/components/voice/DictationField";
import { cn } from "@/lib/utils/cn";

const ANATOMY_KEYS = new Set([
  "anatomyHead",
  "anatomySpine",
  "anatomyHeart",
  "anatomyAbdomen",
  "anatomyStomach",
  "anatomyBladderKidneys",
  "anatomyArms",
  "anatomyLegs",
  "anatomyBrain",
  "anatomyFace",
  "anatomyNeck",
  "anatomyChest",
  "anatomyAbdominalWall",
  "anatomyGi",
  "anatomyGu",
  "anatomyLimbs",
]);

const FIELD_LABELS: Record<string, string> = {
  examDate: "Дата исследования",
  facility: "ЛПУ",
  scanner: "УЗ-сканер",
  probe: "Датчик",
  visualization: "Визуализация",
  parity: "Число родов",
  pretermBirths16to30: "ПР 16–30 нед.",
  maternalWeightKg: "Вес, кг",
  maternalHeightCm: "Рост, см",
  smoking: "Курение",
  diabetes: "СД",
  chronicHypertension: "Хр. АГ",
  sle: "СКВ",
  aps: "АФС",
  conception: "Зачатие",
  lmpDate: "ПДМ",
  eddByLmp: "ПДР по ПДМ",
  gaByCrlWeeks: "СБ нед. (КТР)",
  gaByCrlDays: "СБ дн. (КТР)",
  gaWeeks: "СБ нед.",
  gaDays: "СБ дн.",
  eddByUs: "ПДР по УЗИ",
  fhrBpm: "ЧСС, уд/мин",
  crlMm: "КТР, мм",
  ntMm: "ТВП, мм",
  bpdMm: "БПР, мм",
  ofdMm: "ЛЗР, мм",
  hcMm: "ОГ, мм",
  acMm: "ОЖ, мм",
  flMm: "ДБ, мм",
  hlMm: "ДП, мм",
  dvPi: "DV PI",
  chorionLocation: "Хорион / плацента",
  amnioticFluid: "Околоплодные воды",
  cordVessels: "Пуповина (сосуды)",
  cordInsertion: "Прикрепление пуповины",
  nasalBone: "Кость носа",
  freeBhcgIu: "free β-ХГЧ, МЕ",
  freeBhcgMom: "free β-ХГЧ, MoM",
  pappaIu: "PAPP-A, МЕ",
  pappaMom: "PAPP-A, MoM",
  uterinePiMean: "UtA PI mean",
  uterinePiMom: "UtA PI MoM",
  uterinePiLeft: "UtA PI слева",
  uterinePiRight: "UtA PI справа",
  mapMmHg: "САД, мм рт.ст.",
  mapMom: "САД MoM",
  cervicalLengthMm: "Длина ЦК, мм",
  cerebellumMm: "Мозжечок, мм",
  cisternaMagnaMm: "Большая цистерна, мм",
  posteriorHornMm: "Задний рог, мм",
  efwGrams: "ПМП, г",
  efwPercentile: "Перцентиль ПМП",
  fetalMovements: "Движения плода",
  fetalLie: "Положение плода",
  placentaLocation: "Расположение плаценты",
  placentaThicknessMm: "Толщина плаценты, мм",
  mvpCm: "Наибольший карман, см",
  afiCm: "ИАЖ, см",
  uaPi: "АП PI",
  internalOsShape: "Форма внутр. зева",
  maternalUterusOvaries: "Матка / яичники",
  humerusLMm: "Плечо L, мм",
  humerusRMm: "Плечо R, мм",
  femurLMm: "Бедро L, мм",
  femurRMm: "Бедро R, мм",
  ulnaLMm: "Локтевая L, мм",
  ulnaRMm: "Локтевая R, мм",
  tibiaLMm: "Б/берцовая L, мм",
  tibiaRMm: "Б/берцовая R, мм",
  conclusion: "Заключение",
  recommendations: "Рекомендации",
  anatomyHead: "Головка",
  anatomySpine: "Позвоночник",
  anatomyHeart: "Сердце",
  anatomyAbdomen: "Живот",
  anatomyStomach: "Желудок",
  anatomyBladderKidneys: "МП / почки",
  anatomyArms: "Руки",
  anatomyLegs: "Ноги",
  anatomyBrain: "Мозг",
  anatomyFace: "Лицо",
  anatomyNeck: "Шея",
  anatomyChest: "Грудная клетка",
  anatomyAbdominalWall: "Передняя брюшная стенка",
  anatomyGi: "ЖКТ",
  anatomyGu: "МВС",
  anatomyLimbs: "Конечности",
};

function kindBadge(kind: GuidedStep["kind"]): string {
  if (kind === "look") return "Смотри";
  if (kind === "measure") return "Измерь";
  return "Не пропусти";
}

export function GuidedProtocolWizard() {
  const [weeks, setWeeks] = useState("12");
  const [days, setDays] = useState("4");
  const [crl, setCrl] = useState("");
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [fields, setFields] = useState<GuidedFields>(emptyT1Fields());
  const [completedLookIds, setCompletedLookIds] = useState<string[]>([]);
  const [copyOk, setCopyOk] = useState(false);

  const resolved = useMemo(() => {
    const gaWeeks = Number.parseInt(weeks, 10);
    const gaDaysPart = Number.parseInt(days, 10) || 0;
    const crlMm = crl.trim() ? Number.parseFloat(crl.replace(",", ".")) : undefined;
    return resolveGuidedProtocol({
      gaWeeks: Number.isFinite(gaWeeks) ? gaWeeks : undefined,
      gaDaysPart,
      crlMm: crlMm != null && Number.isFinite(crlMm) ? crlMm : undefined,
    });
  }, [weeks, days, crl]);

  function start() {
    if ("error" in resolved) return;
    setFields(
      isT1Window(resolved.catalogWindowId) ? emptyT1Fields() : emptyT2Fields(),
    );
    setCompletedLookIds([]);
    setStepIndex(0);
    setStarted(true);
  }

  if (!started || "error" in resolved) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
            SonoGyn Guided · beyond Astraia
          </p>
          <h1 className="text-2xl font-bold">Протокол по сроку беременности</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Введите срок или КТР — система проведёт по шагам: что смотреть, что измерить, что не
            пропустить. Поля в духе Astraia/ДЗМ; сценарий — SonoGyn.
          </p>
        </header>

        <div className="grid gap-3 rounded-2xl border border-[var(--clinical-border)] p-5 sm:grid-cols-3">
          <label className="text-sm">
            Недели
            <Input
              className="mt-1"
              inputMode="numeric"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Дни
            <Input
              className="mt-1"
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </label>
          <label className="text-sm">
            или КТР, мм
            <Input
              className="mt-1"
              inputMode="decimal"
              value={crl}
              onChange={(e) => setCrl(e.target.value)}
              placeholder="опционально"
            />
          </label>
        </div>

        {"error" in resolved ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
            {resolved.error}
          </p>
        ) : (
          <div className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-4 text-sm">
            <p className="font-semibold">{resolved.window.meta.labelRu}</p>
            <p className="text-[var(--clinical-foreground-muted)]">
              Срок {resolved.window.gaLabel} · шагов: {resolved.steps.length}
            </p>
            {resolved.window.bannerRu ? (
              <p className="mt-2 text-amber-800 dark:text-amber-200">{resolved.window.bannerRu}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
              {resolved.window.meta.sourceNoteRu}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={start} disabled={"error" in resolved}>
            Начать по шагам
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ai/consultants/fmf">← FMF</Link>
          </Button>
        </div>
      </div>
    );
  }

  const steps = resolved.steps;
  const step = steps[stepIndex]!;
  const comp = completeness(fields, steps, { completedStepIds: completedLookIds });
  const protocolText = renderProtocolText(
    fields as GuidedT1Fields & GuidedT2Fields,
    resolved.catalogWindowId,
    resolved.window.gaLabel,
  );

  function setField(key: string, raw: string) {
    setFields((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      if (ANATOMY_KEYS.has(key)) {
        next[key] = raw;
      } else if (
        key.includes("Mm") ||
        key.includes("Kg") ||
        key.includes("Cm") ||
        key.includes("Bpm") ||
        key.includes("Pi") ||
        key.includes("Mom") ||
        key.includes("Iu") ||
        key.includes("Grams") ||
        key.includes("Percentile") ||
        key === "parity" ||
        key === "pretermBirths16to30" ||
        key === "gaWeeks" ||
        key === "gaDays" ||
        key === "gaByCrlWeeks" ||
        key === "gaByCrlDays"
      ) {
        const n = Number.parseFloat(raw.replace(",", "."));
        next[key] = raw.trim() === "" || Number.isNaN(n) ? null : n;
      } else {
        next[key] = raw;
      }
      return next as GuidedFields;
    });
  }

  async function copyProtocol() {
    try {
      await navigator.clipboard.writeText(protocolText);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setCopyOk(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr_1fr]">
      <aside className="space-y-3">
        <p className="text-xs font-semibold uppercase text-[var(--clinical-primary-deep)]">
          {resolved.window.meta.labelRu}
        </p>
        <p className="text-sm font-medium">Полнота {comp.percent}%</p>
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--clinical-muted)]"
          role="progressbar"
          aria-valuenow={comp.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[var(--clinical-primary)] transition-all"
            style={{ width: `${comp.percent}%` }}
          />
        </div>
        <ol className="space-y-1 text-xs">
          {steps.map((s, i) => {
            const st = comp.stepStatus[i];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-2 py-1.5 text-left",
                    i === stepIndex && "bg-[var(--clinical-primary)]/15 font-semibold",
                    st?.done && "text-emerald-700 dark:text-emerald-300",
                  )}
                  onClick={() => setStepIndex(i)}
                >
                  {s.order}. {s.titleRu}
                </button>
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="outline" size="sm" onClick={() => setStarted(false)}>
          Сменить срок
        </Button>
      </aside>

      <section className="space-y-4 rounded-2xl border border-[var(--clinical-border)] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--clinical-border)] px-2 py-0.5 text-xs font-semibold">
            {kindBadge(step.kind)}
          </span>
          <h2 className="text-lg font-semibold">{step.titleRu}</h2>
        </div>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">{step.hintRu}</p>

        {step.kind === "red_flag" || (step.kind === "look" && step.fieldKeys.length === 0) ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={completedLookIds.includes(step.id)}
              onChange={(e) => {
                setCompletedLookIds((prev) =>
                  e.target.checked ? [...prev, step.id] : prev.filter((id) => id !== step.id),
                );
              }}
            />
            Отметил(а) на исследовании
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {step.fieldKeys.map((key) => {
            const label = FIELD_LABELS[key] ?? key;
            const val = (fields as Record<string, unknown>)[key];
            if (ANATOMY_KEYS.has(key)) {
              return (
                <label key={key} className="text-sm">
                  {label}
                  <select
                    className="mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
                    value={typeof val === "string" ? val : ""}
                    onChange={(e) => setField(key, e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="ok">б/о</option>
                    <option value="abnormal">отклонение</option>
                    <option value="not_assessed">не оценено</option>
                  </select>
                </label>
              );
            }
            if (key === "conclusion" || key === "recommendations") {
              return (
                <div key={key} className="space-y-1 text-sm sm:col-span-2">
                  <span>{label}</span>
                  <DictationField
                    value={typeof val === "string" ? val : ""}
                    onChange={(next) => setField(key, next)}
                    draftKey={`guided-${key}`}
                    ariaLabel={label}
                    multiline
                    placeholder="Текст или диктовка с микрофона"
                  />
                </div>
              );
            }
            return (
              <label key={key} className="text-sm">
                {label}
                <Input
                  className="mt-1"
                  value={val == null ? "" : String(val)}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Назад
          </Button>
          <Button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={stepIndex >= steps.length - 1}
          >
            Далее
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={stepIndex >= steps.length - 1}
          >
            Пропустить
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Протокол</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => void copyProtocol()}>
            {copyOk ? "Скопировано" : "Копировать"}
          </Button>
        </div>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--clinical-muted)]/40 p-3 font-mono text-[11px] leading-relaxed">
          {protocolText}
        </pre>
      </section>
    </div>
  );
}
