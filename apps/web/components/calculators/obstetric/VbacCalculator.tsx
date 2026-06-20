"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  VBAC_DISCLAIMER,
  assessVbacInLabor,
  assessVbacPreLabor,
  type VbacInLaborInput,
  type VbacPreInput,
} from "@repo/medical-calculations";

type Tab = "pre" | "labor";

function BoolChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <CalcChip label={value ? `✓ ${label}` : label} selected={value} onClick={() => onChange(!value)} />
  );
}

const DEFAULT_PRE: VbacPreInput = {
  singleLtcs: true,
  nonRecurringIndication: true,
  priorVaginalBirth: false,
  interval18Months: true,
  noMacrosomiaSuspected: true,
  cephalicSingleton: true,
  noPlacentaPrevia: true,
  noClassicalScar: true,
  noUterineRuptureHistory: true,
  continuousMonitoringAvailable: true,
};

const DEFAULT_LABOR: VbacInLaborInput = {
  spontaneousLabor: true,
  activeLabor: true,
  dilationAtLeast4cm: true,
  noExcessiveOxytocin: true,
  ctgCategory1: true,
  noAntepartumBleedingInLabor: true,
  noHyperstimulation: true,
};

export function VbacCalculator() {
  const [tab, setTab] = useState<Tab>("pre");
  const [pre, setPre] = useState<VbacPreInput>(DEFAULT_PRE);
  const [labor, setLabor] = useState<VbacInLaborInput>(DEFAULT_LABOR);

  const preResult = useMemo(() => assessVbacPreLabor(pre), [pre]);
  const laborResult = useMemo(() => assessVbacInLabor(labor), [labor]);

  const setPreBool = (key: keyof VbacPreInput) => (v: boolean) => setPre((p) => ({ ...p, [key]: v }));
  const setLaborBool = (key: keyof VbacInLaborInput) => (v: boolean) => setLabor((p) => ({ ...p, [key]: v }));

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calculators/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto max-w-3xl space-y-2">
        <Badge variant="outline">TOLAC / VBAC</Badge>
        <h1 className="text-3xl font-black tracking-tight">Роды после кесарева сечения</h1>
      </header>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-1 rounded-lg bg-[var(--clinical-muted)] p-1">
          {(
            [
              ["pre", "До родов"],
              ["labor", "В родах"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                tab === id ? "bg-[var(--clinical-card)] shadow-sm" : "text-[var(--clinical-foreground-muted)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "pre" ? (
          <div className="space-y-4">
            <CalcStepCard title="Критерии отбора TOLAC">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DEFAULT_PRE) as (keyof VbacPreInput)[]).map((key) => (
                  <BoolChip
                    key={key}
                    label={PRE_LABELS[key]}
                    value={pre[key]}
                    onChange={setPreBool(key)}
                  />
                ))}
              </div>
            </CalcStepCard>
            <ResultPanel
              title={`${preResult.score}/${preResult.maxScore} · ${preResult.category}`}
              lines={preResult.lines}
              ok={preResult.tolacEligible}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <CalcStepCard title="Мониторинг в родах">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DEFAULT_LABOR) as (keyof VbacInLaborInput)[]).map((key) => (
                  <BoolChip
                    key={key}
                    label={LABOR_LABELS[key]}
                    value={labor[key] ?? false}
                    onChange={setLaborBool(key)}
                  />
                ))}
              </div>
            </CalcStepCard>
            <ResultPanel
              title={laborResult.continueTolac ? "TOLAC продолжается" : "Рассмотреть прекращение TOLAC"}
              lines={[...laborResult.alerts, "", ...laborResult.monitoring]}
              ok={laborResult.continueTolac}
            />
          </div>
        )}
        <p className="mt-6 text-center text-xs text-[var(--clinical-foreground-muted)]">{VBAC_DISCLAIMER}</p>
      </div>
    </div>
  );
}

const PRE_LABELS: Record<keyof VbacPreInput, string> = {
  singleLtcs: "Один LTCS",
  nonRecurringIndication: "Нерекur rentное показание",
  priorVaginalBirth: "Были вагинальные роды",
  interval18Months: "Интервал ≥18 мес",
  noMacrosomiaSuspected: "Нет макросомии",
  cephalicSingleton: "Головное, одноплодие",
  noPlacentaPrevia: "Нет placenta previa",
  noClassicalScar: "Нет классического рубца",
  noUterineRuptureHistory: "Нет разрыва матки",
  continuousMonitoringAvailable: "CTG + экстренное КС",
};

const LABOR_LABELS: Record<keyof VbacInLaborInput, string> = {
  spontaneousLabor: "Спontaneous / индукция по протоколу",
  activeLabor: "Активная фаза",
  dilationAtLeast4cm: "Раскрытие ≥4 см",
  noExcessiveOxytocin: "Нет гиперстимуляции окситоцином",
  ctgCategory1: "CTG категория I",
  noAntepartumBleedingInLabor: "Нет кровотечения",
  noHyperstimulation: "Нет гипердинамики",
  epiduralUsed: "Эpidural (не противопоказание)",
};

function ResultPanel({ title, lines, ok }: { title: string; lines: string[]; ok: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-5",
        ok ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800" : "border-amber-300 bg-amber-50/50",
      )}
    >
      <p className="font-bold">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {lines.join("\n")}
      </pre>
    </section>
  );
}
