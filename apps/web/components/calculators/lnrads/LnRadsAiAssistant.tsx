"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import {
  atlasImageUrl,
  casesByDifficulty,
  recognizePattern,
  type LnCaseDifficulty,
  type LnPatternId,
} from "@/lib/ln-rads-us";

const PATTERNS: { id: LnPatternId; label: string }[] = [
  { id: "oval", label: "Овальный" },
  { id: "round", label: "Округлый" },
  { id: "lobulated", label: "Дольчатый" },
  { id: "spiculated", label: "Spiculated" },
  { id: "necrotic", label: "Некроз" },
  { id: "cystic", label: "Кистозный" },
  { id: "calcified", label: "Кальцинаты" },
  { id: "reactive", label: "Реактивный" },
];

const CASE_IMAGES: Record<string, string> = {
  case_b1: "reactive_node.svg",
  case_b2: "normal_oval_node.svg",
  case_i1: "breast_metastasis_node.svg",
  case_i2: "thyroid_metastasis_node.svg",
  case_a1: "tuberculosis_node.svg",
  case_a2: "lymphoma_node.svg",
  case_e1: "spiculated_malignant_node.svg",
  case_e2: "gynecologic_metastasis_node.svg",
};

export function LnRadsAiAssistant() {
  const [pattern, setPattern] = useState<LnPatternId>("oval");
  const result = useMemo(() => recognizePattern(pattern), [pattern]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <p className="text-sm text-[var(--clinical-foreground-muted)]">
        AI Pattern Recognition: выберите морфологический паттерн — система предскажет диагноз, LN-RADS и рекомендации.
      </p>

      <div className="flex flex-wrap gap-2">
        {PATTERNS.map((p) => (
          <CalcChip key={p.id} label={p.label} selected={pattern === p.id} onClick={() => setPattern(p.id)} />
        ))}
      </div>

      <CalcStepCard title="Результат pattern recognition">
        <div className="flex flex-wrap gap-2">
          <Badge>LN-RADS {result.lnRadsCategory}</Badge>
          <Badge variant="outline">Risk: {result.estimatedMalignancyRisk}</Badge>
        </div>
        <p className="mt-2 text-sm">{result.teachingNote}</p>
        <p className="mt-2 text-sm font-bold">Predicted diagnoses:</p>
        <ul className="list-inside list-disc text-sm">
          {result.predictedDiagnoses.map((d) => (
            <li key={d.id}>{d.nameRu}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-bold">Recommendations:</p>
        <ul className="list-inside list-disc text-sm">
          {result.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </CalcStepCard>
    </div>
  );
}

export function LnRadsCaseLibrary() {
  const [difficulty, setDifficulty] = useState<LnCaseDifficulty>("beginner");
  const cases = useMemo(() => casesByDifficulty(difficulty), [difficulty]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {(["beginner", "intermediate", "advanced", "expert"] as const).map((d) => (
          <CalcChip
            key={d}
            label={d === "beginner" ? "Beginner" : d === "intermediate" ? "Intermediate" : d === "advanced" ? "Advanced" : "Expert"}
            selected={difficulty === d}
            onClick={() => setDifficulty(d)}
          />
        ))}
      </div>

      {cases.map((c) => (
        <article key={c.id} className="clinical-surface overflow-hidden rounded-2xl border">
          {CASE_IMAGES[c.id] ? (
            <div className="relative aspect-[16/10] w-full bg-slate-900">
              <Image
                src={atlasImageUrl(CASE_IMAGES[c.id]!)}
                alt={c.titleRu}
                fill
                className="object-contain p-2"
                sizes="800px"
              />
            </div>
          ) : null}
          <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black">{c.titleRu}</h3>
            <Badge>LN-RADS {c.suggestedLnRads}</Badge>
          </div>
          <p className="mt-2 text-sm"><span className="font-bold">Анамнез:</span> {c.history}</p>
          <p className="text-sm"><span className="font-bold">Сценарий:</span> {c.clinicalScenario}</p>
          <p className="mt-2 text-sm font-bold">УЗ-признаки</p>
          <ul className="list-inside list-disc text-sm">{c.ultrasoundFindings.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="mt-2 text-sm font-bold">Doppler</p>
          <ul className="list-inside list-disc text-sm">{c.dopplerFindings.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="mt-2 text-sm"><span className="font-bold">Диагноз:</span> {c.diagnosis}</p>
          <p className="text-sm"><span className="font-bold">DDx:</span> {c.differentialDiagnosis.join(", ")}</p>
          <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{c.teachingPoints.join(" ")}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
