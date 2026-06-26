"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  runCpiClinicalDecision,
  CPI_DISCLAIMER,
  type CpiDecisionResult,
  type CpiGlandularSuspicion,
  type CpiPatientInput,
} from "@repo/cervical-pathology-intelligence";
import { IFCPC_SIGNS } from "@repo/ifcpc-expert";

const RISK_COLORS: Record<string, string> = {
  very_low: "#22c55e",
  low: "#14b8a6",
  moderate: "#f59e0b",
  high: "#f97316",
  very_high: "#ef4444",
  critical: "#991b1b",
};

function BoolChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <CalcChip label={value ? `✓ ${label}` : label} selected={value} onClick={() => onChange(!value)} />;
}

function toggle(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function defaultInput(): CpiPatientInput {
  return {
    age: 35,
    pregnancy: false,
    immunodeficiency: false,
    adequacyId: "adequacy_satisfactory",
    scjVisibilityId: "scj_completely_visible",
    transformationZoneTypeId: "tz2",
    ifcpcFindingSignIds: [],
    hpvStatus: "positive",
    hpv16Positive: false,
    hpv18Positive: false,
    hpv3133455258Positive: false,
    otherHrHpvPositive: true,
    viralLoad: "not_available",
    cytology: "lsil",
    glandularSuspicion: "none",
    endocervicalComponentPresent: null,
    suspectedGlandularLesion: false,
    priorBiopsy: "none",
    priorCinTreatment: "none",
    currentBiopsyResult: "none",
    quality: {
      photoPreAcetic: true,
      photoPostAcetic: true,
      photoPostSchiller: false,
      tzDocumented: true,
      adequacyDocumented: true,
      scjDocumented: true,
    },
  };
}

function ActionCard({
  action,
}: {
  action: CpiDecisionResult["actions"][number];
}) {
  const urgencyBorder =
    action.priority === "primary"
      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]/40"
      : "border-[var(--clinical-border)] bg-[var(--clinical-card)]";

  return (
    <div className={cn("rounded-xl border-2 p-4", urgencyBorder)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-black">{action.labelRu}</p>
        <Badge variant={action.priority === "primary" ? "default" : "outline"}>{action.priority}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{action.rationale}</p>
      <ul className="mt-2 space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
        {action.sources.map((s) => (
          <li key={s.id}>
            <span className="font-bold">{s.organization} {s.year}:</span> {s.citation}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CpiDecisionEngineFlow() {
  const [input, setInput] = useState<CpiPatientInput>(() => defaultInput());
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(
    () => (calculated ? runCpiClinicalDecision(input) : null),
    [calculated, input],
  );

  const ifcpcSections = [
    { id: "abnormal_grade1", title: "Grade 1" },
    { id: "abnormal_grade2", title: "Grade 2" },
    { id: "suspicious_invasion", title: "Инвазия" },
  ] as const;

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tools/calc/gyn/cin-risk">← CIN Risk Calculator</Link>
      </Button>

      <header className="mx-auto max-w-5xl space-y-2">
        <Badge variant="outline">IFCPC · ASCCP · WHO · ESGO</Badge>
        <h1 className="text-3xl font-black tracking-tight">Cervical Pathology Intelligence</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Clinical Decision Engine — 8 блоков, JSON Rules, дерево решений с источниками.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <CalcStepCard title="Block 1 · IFCPC" required>
            <CalcSubLabel>TZ / SCJ / адекватность</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {(["tz1", "tz2", "tz3"] as const).map((tz) => (
                <CalcChip
                  key={tz}
                  label={tz.toUpperCase()}
                  selected={input.transformationZoneTypeId === tz}
                  onClick={() => setInput((p: CpiPatientInput) => ({ ...p, transformationZoneTypeId: tz }))}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["scj_completely_visible", "SCJ полностью"],
                  ["scj_partially_visible", "SCJ частично"],
                  ["scj_not_visible", "SCJ не видна"],
                ] as const
              ).map(([id, l]) => (
                <CalcChip
                  key={id}
                  label={l}
                  selected={input.scjVisibilityId === id}
                  onClick={() => setInput((p: CpiPatientInput) => ({ ...p, scjVisibilityId: id }))}
                />
              ))}
            </div>
            {ifcpcSections.map((sec) => (
              <div key={sec.id}>
                <CalcSubLabel>{sec.title}</CalcSubLabel>
                <div className="flex flex-wrap gap-2">
                  {IFCPC_SIGNS.filter((s) => s.sectionId === sec.id).map((s) => (
                    <CalcChip
                      key={s.id}
                      label={s.titleRu.split("(")[0].trim().slice(0, 28)}
                      selected={input.ifcpcFindingSignIds.includes(s.id)}
                      onClick={() =>
                        setInput((p: CpiPatientInput) => ({
                          ...p,
                          ifcpcFindingSignIds: toggle(p.ifcpcFindingSignIds, s.id),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </CalcStepCard>

          <CalcStepCard title="Block 2–3 · HPV + Bethesda">
            <label className="block text-sm font-semibold">
              Возраст
              <Input
                className="mt-1 w-24"
                inputMode="numeric"
                value={String(input.age)}
                onChange={(e) => setInput((p: CpiPatientInput) => ({ ...p, age: Number(e.target.value) || 0 }))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <BoolChip label="HPV 16" value={input.hpv16Positive} onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, hpv16Positive: v }))} />
              <BoolChip label="HPV 18" value={input.hpv18Positive} onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, hpv18Positive: v }))} />
              <BoolChip label="31/33/45/52/58" value={input.hpv3133455258Positive} onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, hpv3133455258Positive: v }))} />
              <BoolChip label="Иммунodef." value={input.immunodeficiency} onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, immunodeficiency: v }))} />
              <BoolChip label="Беременность" value={input.pregnancy} onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, pregnancy: v }))} />
            </div>
            <CalcSubLabel>Цитология</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {(["nilm", "ascus", "lsil", "asc_h", "hsil", "agc", "ais"] as const).map((c) => (
                <CalcChip
                  key={c}
                  label={c.toUpperCase()}
                  selected={input.cytology === c}
                  onClick={() => setInput((p: CpiPatientInput) => ({ ...p, cytology: c }))}
                />
              ))}
            </div>
          </CalcStepCard>

          <CalcStepCard title="Block 4 · AIS / железистый">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["none", "Нет"],
                  ["agc_nos", "AGC-NOS"],
                  ["agc_favor_neoplasia", "AGC favor neo"],
                  ["ais_suspected", "AIS suspected"],
                  ["confirmed_ais", "AIS confirmed"],
                ] as const
              ).map(([v, l]) => (
                <CalcChip
                  key={v}
                  label={l}
                  selected={input.glandularSuspicion === v}
                  onClick={() => setInput((p: CpiPatientInput) => ({ ...p, glandularSuspicion: v as CpiGlandularSuspicion }))}
                />
              ))}
            </div>
            <BoolChip
              label="Подозрение на железистое поражение"
              value={input.suspectedGlandularLesion}
              onChange={(v) => setInput((p: CpiPatientInput) => ({ ...p, suspectedGlandularLesion: v }))}
            />
          </CalcStepCard>

          <CalcStepCard title="Block 7 · Quality">
            {(
              [
                ["photoPreAcetic", "Фото до уксуса"],
                ["photoPostAcetic", "После уксуса"],
                ["photoPostSchiller", "После Шиллера"],
                ["tzDocumented", "TZ указана"],
                ["adequacyDocumented", "Адекватность"],
                ["scjDocumented", "SCJ указана"],
              ] as const
            ).map(([key, label]) => (
              <BoolChip
                key={key}
                label={label}
                value={input.quality?.[key] ?? false}
                onChange={(v) =>
                  setInput((p: CpiPatientInput) => ({
                    ...p,
                    quality: { ...p.quality!, [key]: v },
                  }))
                }
              />
            ))}
          </CalcStepCard>

          <Button className="w-full" size="lg" onClick={() => setCalculated(true)}>
            Запустить Clinical Decision Engine
          </Button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <section className="rounded-2xl border border-[var(--clinical-border)] p-5">
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">Кольpоскопическое заключение</p>
                <p className="mt-2 font-semibold">{result.colposcopyConclusion}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge style={{ backgroundColor: RISK_COLORS[result.combinedRiskBand], color: "#fff" }}>
                    Комбинированный риск: {result.combinedRiskBand}
                  </Badge>
                  <Badge variant="outline">CIN2+ {Math.round(result.riskCin2plus * 1000) / 10}%</Badge>
                  <Badge variant="outline">CIN3+ {Math.round(result.riskCin3plus * 1000) / 10}%</Badge>
                </div>
                {result.tz3Alert ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    Block 5 TZ3: {result.tz3Alert}
                  </p>
                ) : null}
                {result.glandularAlert ? (
                  <p className="mt-2 rounded-lg bg-violet-50 p-3 text-sm font-semibold text-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
                    Block 4: {result.glandularAlert}
                  </p>
                ) : null}
                {result.qualityScore !== null ? (
                  <p className="mt-2 text-sm">
                    Block 7 Quality: <strong>{result.qualityScore}/100</strong> — {result.qualityLabel}
                  </p>
                ) : null}
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black">{result.explanation.headline}</h2>
                <p className="text-sm text-[var(--clinical-foreground-muted)]">{result.explanation.narrative}</p>
                {result.actions.map((a: CpiDecisionResult["actions"][number]) => (
                  <ActionCard key={a.action} action={a} />
                ))}
              </section>

              <details className="rounded-2xl border p-4 text-xs">
                <summary className="cursor-pointer font-black">Дерево решений</summary>
                <ol className="mt-2 list-inside list-decimal space-y-1 font-mono text-[10px] leading-relaxed">
                  {result.explanation.decisionTreePath.map((step: string) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>

              <details className="rounded-2xl border p-4 text-xs">
                <summary className="cursor-pointer font-black">Сработавшие правила ({result.explanation.matchedRules.length})</summary>
                <ul className="mt-2 space-y-2">
                  {result.explanation.matchedRules.map((r: CpiDecisionResult["explanation"]["matchedRules"][number]) => (
                    <li key={r.ruleId} className="border-b pb-2">
                      <span className="font-bold">{r.ruleId}</span> — {r.titleRu}
                      <p className="text-[var(--clinical-foreground-muted)]">{r.explanation}</p>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
              Заполните блоки 1–7 и запустите Decision Engine
            </section>
          )}
          <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{CPI_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
