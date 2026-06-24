"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  calculateCinRisk,
  getCinRiskModelMeta,
  IFCPC_SIGNS,
  type BethesdaCytology,
  type CinRiskCalculatorInput,
  type CinRiskCalculatorResult,
  type CinRiskProbability,
  type HpvStatus,
  type PriorBiopsyResult,
  type PriorCinTreatmentHistory,
} from "@repo/ifcpc-expert";

const CYTOLOGY_OPTS: { v: BethesdaCytology; l: string }[] = [
  { v: "nilm", l: "NILM" },
  { v: "ascus", l: "ASC-US" },
  { v: "lsil", l: "LSIL" },
  { v: "asc_h", l: "ASC-H" },
  { v: "hsil", l: "HSIL" },
  { v: "agc", l: "AGC" },
  { v: "unsatisfactory", l: "Unsatisfactory" },
];

const HPV_OPTS: { v: HpvStatus; l: string }[] = [
  { v: "negative", l: "ВПЧ −" },
  { v: "positive", l: "ВПЧ +" },
  { v: "not_tested", l: "Не тестировали" },
];

const TZ_OPTS = [
  { v: "tz1" as const, l: "TZ1" },
  { v: "tz2" as const, l: "TZ2" },
  { v: "tz3" as const, l: "TZ3" },
];

const BIOPSY_OPTS: { v: PriorBiopsyResult; l: string }[] = [
  { v: "none", l: "Нет данных" },
  { v: "negative", l: "Negative" },
  { v: "cin1", l: "CIN 1" },
  { v: "cin2", l: "CIN 2" },
  { v: "cin3", l: "CIN 3" },
  { v: "ais", l: "AIS" },
  { v: "invasion", l: "Инвазия" },
];

const TX_OPTS: { v: PriorCinTreatmentHistory; l: string }[] = [
  { v: "none", l: "Не лечили" },
  { v: "excision_success", l: "Excision, margins −" },
  { v: "excision_incomplete", l: "Excision, margins +" },
  { v: "ablation", l: "Ablation" },
  { v: "repeat_treatment", l: "Повторное лечение" },
];

const IFCPC_SECTIONS = [
  { id: "abnormal_grade1", title: "IFCPC Grade 1" },
  { id: "abnormal_grade2", title: "IFCPC Grade 2" },
  { id: "suspicious_invasion", title: "Подозрение на инвазию" },
  { id: "normal_findings", title: "Норма (опционально)" },
] as const;

function BoolChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <CalcChip label={value ? `✓ ${label}` : label} selected={value} onClick={() => onChange(!value)} />
  );
}

function toggleSign(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function RiskBar({ label, pct, color, highlight }: { label: string; pct: number; color: string; highlight?: boolean }) {
  return (
    <div className={cn("space-y-1", highlight && "rounded-xl border-2 border-slate-900/10 p-2 dark:border-white/10")}>
      <div className="flex items-center justify-between text-xs font-bold">
        <span>{label}</span>
        <span style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function RiskScalePanel({ result }: { result: CinRiskCalculatorResult }) {
  const bars: { key: string; label: string; pct: number; color: string; highlight?: boolean }[] = [
    { key: "cin1", label: "CIN 1", pct: result.cin1 * 100, color: "#14b8a6" },
    { key: "cin2", label: "CIN 2", pct: result.cin2 * 100, color: "#f59e0b" },
    { key: "cin3", label: "CIN 3", pct: result.cin3 * 100, color: "#f97316" },
    { key: "ais", label: "AIS", pct: result.ais * 100, color: "#ea580c" },
    { key: "invasion", label: "Инвазия", pct: result.invasion * 100, color: "#dc2626", highlight: true },
  ];

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-black">Шкала риска</h2>
        <Badge style={{ backgroundColor: result.cin2plusTier.color, color: "#fff" }}>
          CIN2+ · {result.cin2plusTier.labelRu} · {result.cin2plusPercentage}%
        </Badge>
        <Badge variant="outline" style={{ borderColor: result.invasionTier.color, color: result.invasionTier.color }}>
          Инвазия · {result.invasionTier.labelRu} · {result.invasionPercentage}%
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {bars.map((b) => (
          <RiskBar key={b.key} label={b.label} pct={b.pct} color={b.color} highlight={b.highlight} />
        ))}
      </div>
      <div
        className="rounded-xl p-4 text-sm font-semibold text-white"
        style={{ backgroundColor: result.cin2plusTier.color }}
      >
        CIN3+ (HSIL/AIS/инвазия): {result.cin3plusPercentage}%
      </div>
    </section>
  );
}

function RecommendationPanel({ result }: { result: CinRiskCalculatorResult }) {
  const urgencyColors = {
    routine: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
    soon: "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
    urgent: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
    emergency: "border-red-500 bg-red-50 dark:bg-red-950/30",
  };

  return (
    <section className={cn("rounded-2xl border-2 p-5", urgencyColors[result.recommendation.urgency])}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">Клинические рекомендации</p>
      <p className="mt-2 text-base font-bold leading-snug">{result.recommendation.summary}</p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
        {result.recommendation.actions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm font-semibold">Наблюдение: {result.recommendation.followUp}</p>
      <p className="mt-2 text-xs opacity-70">{result.recommendation.references.join(" · ")}</p>
    </section>
  );
}

function ProbabilityTable({ rows }: { rows: CinRiskProbability[] }) {
  return (
    <details className="rounded-2xl border border-[var(--clinical-border)] p-4">
      <summary className="cursor-pointer text-sm font-black">Полная таблица вероятностей</summary>
      <table className="mt-3 w-full text-left text-xs">
        <thead>
          <tr className="border-b text-[var(--clinical-foreground-muted)]">
            <th className="py-1">Исход</th>
            <th className="py-1 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.outcome} className="border-b border-[var(--clinical-border)]/50">
              <td className="py-1.5">{r.labelRu}</td>
              <td className="py-1.5 text-right font-bold">{r.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function CinRiskCalculator() {
  const meta = getCinRiskModelMeta();
  const [age, setAge] = useState("35");
  const [hpvStatus, setHpvStatus] = useState<HpvStatus>("positive");
  const [hpv16, setHpv16] = useState(false);
  const [hpv18, setHpv18] = useState(false);
  const [otherHr, setOtherHr] = useState(true);
  const [cytology, setCytology] = useState<BethesdaCytology>("lsil");
  const [tz, setTz] = useState<"tz1" | "tz2" | "tz3">("tz2");
  const [ifcpcIds, setIfcpcIds] = useState<string[]>([]);
  const [priorBiopsy, setPriorBiopsy] = useState<PriorBiopsyResult>("none");
  const [priorTx, setPriorTx] = useState<PriorCinTreatmentHistory>("none");
  const [immuno, setImmuno] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const input: CinRiskCalculatorInput | null = useMemo(() => {
    const a = Number.parseInt(age, 10);
    if (!Number.isFinite(a) || a < 15 || a > 90) return null;
    return {
      age: a,
      hpvStatus,
      hpv16Positive: hpv16,
      hpv18Positive: hpv18,
      otherHrHpvPositive: otherHr,
      cytology,
      transformationZoneTypeId: tz,
      ifcpcFindingSignIds: ifcpcIds,
      priorBiopsy,
      immunodeficiency: immuno,
      pregnancy: pregnant,
      priorCinTreatment: priorTx,
    };
  }, [age, hpvStatus, hpv16, hpv18, otherHr, cytology, tz, ifcpcIds, priorBiopsy, priorTx, immuno, pregnant]);

  const result = useMemo(() => (calculated && input ? calculateCinRisk(input) : null), [calculated, input]);

  const ifcpcBySection = useMemo(() => {
    const map = new Map<string, typeof IFCPC_SIGNS>();
    for (const section of IFCPC_SECTIONS) {
      map.set(
        section.id,
        IFCPC_SIGNS.filter((s) => s.sectionId === section.id),
      );
    }
    return map;
  }, []);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calculators/colposcopy">← Кольпоскопия · Swede</Link>
      </Button>

      <header className="mx-auto max-w-4xl space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">IFCPC 2011 · ASCCP 2019</Badge>
          <Badge className="bg-[var(--clinical-primary)]">CIN Risk v{meta.version}</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Калькулятор риска CIN2+ / CIN3+ / инвазии</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Мультиномиальная logit-модель: Bethesda + HPV + TZ + IFCPC + анамнез. {meta.formula.cin2plus}
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcStepCard title="1 · Демография" required>
            <label className="block text-sm font-semibold">
              Возраст
              <Input className="mt-1 w-24" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <BoolChip label="Иммунodeficiency" value={immuno} onChange={setImmuno} />
              <BoolChip label="Беременность" value={pregnant} onChange={setPregnant} />
            </div>
          </CalcStepCard>

          <CalcStepCard title="2 · HPV" required>
            <CalcSubLabel>Статус ВПЧ</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {HPV_OPTS.map((o) => (
                <CalcChip key={o.v} label={o.l} selected={hpvStatus === o.v} onClick={() => setHpvStatus(o.v)} />
              ))}
            </div>
            <CalcSubLabel>Генотипы</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              <BoolChip label="HPV 16" value={hpv16} onChange={setHpv16} />
              <BoolChip label="HPV 18" value={hpv18} onChange={setHpv18} />
              <BoolChip label="Другие ВРЧ" value={otherHr} onChange={setOtherHr} />
            </div>
          </CalcStepCard>

          <CalcStepCard title="3 · Цитология Bethesda" required>
            <div className="flex flex-wrap gap-2">
              {CYTOLOGY_OPTS.map((o) => (
                <CalcChip key={o.v} label={o.l} selected={cytology === o.v} onClick={() => setCytology(o.v)} />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="4 · Зона трансформации">
            <div className="flex flex-wrap gap-2">
              {TZ_OPTS.map((o) => (
                <CalcChip key={o.v} label={o.l} selected={tz === o.v} onClick={() => setTz(o.v)} />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="5 · IFCPC признаки">
            {IFCPC_SECTIONS.map((section) => {
              const signs = ifcpcBySection.get(section.id) ?? [];
              if (signs.length === 0) return null;
              return (
                <div key={section.id} className="space-y-2">
                  <CalcSubLabel>{section.title}</CalcSubLabel>
                  <div className="flex flex-wrap gap-2">
                    {signs.map((s) => (
                      <CalcChip
                        key={s.id}
                        label={s.titleRu.replace(/ \(.*\)/, "")}
                        selected={ifcpcIds.includes(s.id)}
                        onClick={() => setIfcpcIds((ids) => toggleSign(ids, s.id))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CalcStepCard>

          <CalcStepCard title="6 · Анамнез">
            <CalcSubLabel>Предыдущая биопсия</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {BIOPSY_OPTS.map((o) => (
                <CalcChip key={o.v} label={o.l} selected={priorBiopsy === o.v} onClick={() => setPriorBiopsy(o.v)} />
              ))}
            </div>
            <CalcSubLabel>Лечение CIN</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {TX_OPTS.map((o) => (
                <CalcChip key={o.v} label={o.l} selected={priorTx === o.v} onClick={() => setPriorTx(o.v)} />
              ))}
            </div>
          </CalcStepCard>

          <Button
            className="w-full"
            size="lg"
            disabled={!input}
            onClick={() => setCalculated(true)}
          >
            Рассчитать риск
          </Button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <RiskScalePanel result={result} />
              <RecommendationPanel result={result} />
              <ProbabilityTable rows={result.probabilities} />
              <details className="rounded-2xl border border-[var(--clinical-border)] p-4 text-xs">
                <summary className="cursor-pointer font-black">Алгоритм (шаги модели)</summary>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-[var(--clinical-foreground-muted)]">
                  {result.algorithmSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="mt-3 font-mono text-[10px] leading-relaxed opacity-70">
                  L_k = β₀ + Σw·x → P_k = e^L_k / Σe^L_j
                </p>
              </details>
            </>
          ) : (
            <section className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[var(--clinical-border)] p-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
              Заполните параметры и нажмите «Рассчитать риск»
            </section>
          )}
          <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{meta.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
