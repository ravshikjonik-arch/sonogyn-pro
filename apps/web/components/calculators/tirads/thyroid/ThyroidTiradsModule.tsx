"use client";

import {
  evaluateThyroidStudy,
  generateThyroidReport,
  type EuPolicyProfile,
  type ThyroidNodule,
  type ThyroidReportSystem,
  type ThyroidStudyInput,
} from "@repo/tirads-acr";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { AcrResultCard, EuResultCard } from "@/components/calculators/tirads/thyroid/ThyroidResultCards";
import {
  ThyroidAcrFeaturesForm,
  ThyroidEuFeaturesForm,
  ThyroidNoduleBasics,
} from "@/components/calculators/tirads/thyroid/ThyroidNoduleForms";
import {
  ThyroidComparisonTable,
  ThyroidReferencePanel,
  ThyroidReportPanel,
} from "@/components/calculators/tirads/thyroid/ThyroidStudyPanels";
import { ClinicalCdssDisclaimer } from "@/components/clinical/ClinicalCdssDisclaimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type ThyroidModuleTab = "eu" | "acr" | "compare" | "reference";

const LOCATION_SHORT: Record<string, string> = { right_lobe: "правая", left_lobe: "левая", isthmus: "перешеек" };
const LYMPH_OPTIONS: { value: NonNullable<ThyroidStudyInput["lymphNodes"]>; labelRu: string }[] = [
  { value: "not_assessed", labelRu: "Не оценивались" },
  { value: "normal", labelRu: "Без особенностей" },
  { value: "indeterminate", labelRu: "Неопределённые" },
  { value: "suspicious", labelRu: "Подозрительные" },
];

let noduleSeq = 1;
const newNodule = (): ThyroidNodule => ({ id: `nodule-${noduleSeq++}` });

export function ThyroidTiradsModule({ tab }: { tab: ThyroidModuleTab }) {
  const [study, setStudy] = useState<ThyroidStudyInput>(() => ({
    nodules: [newNodule()],
    euProfile: "RU_KR_2024",
    lymphNodes: "not_assessed",
  }));
  const [activeId, setActiveId] = useState(study.nodules[0].id);

  const evaluation = useMemo(() => evaluateThyroidStudy(study), [study]);
  const reportSystem: ThyroidReportSystem = tab === "acr" ? "acr" : tab === "compare" ? "both" : "eu";
  const report = useMemo(() => generateThyroidReport(study, evaluation, reportSystem), [study, evaluation, reportSystem]);

  const active = study.nodules.find((n) => n.id === activeId) ?? study.nodules[0];
  const activeRow = evaluation.nodules.find((r) => r.noduleId === active.id) ?? null;
  const highestId = tab === "acr" ? evaluation.highestAcr : evaluation.highestEu;

  const updateNodule = (next: ThyroidNodule) =>
    setStudy((s) => ({ ...s, nodules: s.nodules.map((n) => (n.id === next.id ? next : n)) }));
  const addNodule = () => {
    const n = newNodule();
    setStudy((s) => ({ ...s, nodules: [...s.nodules, n] }));
    setActiveId(n.id);
  };
  const removeNodule = (id: string) => {
    setStudy((s) => {
      const nodules = s.nodules.filter((n) => n.id !== id);
      return { ...s, nodules: nodules.length ? nodules : [newNodule()] };
    });
    if (id === activeId) setActiveId(study.nodules.find((n) => n.id !== id)?.id ?? "");
  };

  if (tab === "reference") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-10">
        <ThyroidReferencePanel />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 lg:px-10" data-e2e-thyroid-module={tab}>
      <CalcStepCard title="Исследование">
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Узлы">
          {study.nodules.map((n, i) => {
            const row = evaluation.nodules.find((r) => r.noduleId === n.id);
            const cat =
              tab === "acr"
                ? row?.acr?.status === "ok"
                  ? row.acr.result.category
                  : null
                : row?.eu?.status === "ok"
                  ? `EU ${row.eu.category}`
                  : null;
            return (
              <button
                key={n.id}
                type="button"
                role="tab"
                aria-selected={n.id === active.id}
                onClick={() => setActiveId(n.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-xs font-bold transition",
                  n.id === active.id
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                    : "clinical-surface hover:border-[var(--clinical-primary)]",
                )}
              >
                Узел {i + 1}
                {n.location ? ` · ${LOCATION_SHORT[n.location]}` : ""}
                {cat ? ` · ${cat}` : ""}
                {study.nodules.length > 1 && highestId === n.id ? " · наибольший риск" : ""}
              </button>
            );
          })}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addNodule}>
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
            Узел
          </Button>
          {study.nodules.length > 1 ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => removeNodule(active.id)} aria-label="Удалить текущий узел">
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>

        {tab !== "acr" ? (
          <>
            <CalcSubLabel>Профиль рекомендаций EU-TIRADS</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["RU_KR_2024", "КР 2024 (РФ)"],
                  ["ETA_2023", "ETA 2023"],
                ] as [EuPolicyProfile, string][]
              ).map(([value, labelRu]) => (
                <CalcChip
                  key={value}
                  label={labelRu}
                  selected={study.euProfile === value}
                  onClick={() => setStudy((s) => ({ ...s, euProfile: value }))}
                />
              ))}
            </div>
          </>
        ) : null}

        <CalcSubLabel>Регионарные лимфоузлы (оцениваются отдельно от категории узла)</CalcSubLabel>
        <div className="flex flex-wrap gap-2">
          {LYMPH_OPTIONS.map((o) => (
            <CalcChip
              key={o.value}
              label={o.labelRu}
              selected={study.lymphNodes === o.value}
              onClick={() => setStudy((s) => ({ ...s, lymphNodes: o.value }))}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--clinical-foreground)]">
          <input
            type="checkbox"
            checked={Boolean(study.isPediatric)}
            onChange={(e) => setStudy((s) => ({ ...s, isPediatric: e.target.checked || undefined }))}
          />
          Пациент младше 18 лет
        </label>
      </CalcStepCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ThyroidNoduleBasics nodule={active} onChange={updateNodule} />
          {tab !== "acr" ? <ThyroidEuFeaturesForm nodule={active} onChange={updateNodule} /> : null}
          {tab !== "eu" ? <ThyroidAcrFeaturesForm nodule={active} onChange={updateNodule} /> : null}
        </div>
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {tab !== "acr" ? <EuResultCard result={activeRow?.eu ?? null} /> : null}
          {tab !== "eu" ? <AcrResultCard result={activeRow?.acr ?? null} /> : null}
        </div>
      </div>

      {evaluation.errors.length ? (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100">
          {evaluation.errors.map((e) => e.messageRu).join(" ")}
        </p>
      ) : null}

      {tab === "compare" ? <ThyroidComparisonTable study={study} evaluation={evaluation} /> : null}
      <ThyroidReportPanel report={report} />
      <ClinicalCdssDisclaimer />
    </div>
  );
}
