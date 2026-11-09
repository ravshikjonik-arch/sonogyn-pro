"use client";

import {
  BIRADS_CATEGORY_INFO,
  evaluateBreastStudy,
  generateBreastReport,
  type BiradsCategory,
  type BreastLesion,
  type BreastLymphAssessment,
  type BreastLymphNodeFinding,
  type BreastLymphStation,
  type BreastSide,
  type BreastStudyInput,
} from "@repo/birads-us";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BreastLesionForm } from "@/components/calculators/birads/us2025/BreastLesionForm";
import { BreastLesionResultCard } from "@/components/calculators/birads/us2025/BreastLesionResultCard";
import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { ClinicalCdssDisclaimer } from "@/components/clinical/ClinicalCdssDisclaimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const SIDE_SHORT: Record<BreastSide, string> = { right: "правая", left: "левая" };
const STATIONS: { value: BreastLymphStation; labelRu: string }[] = [
  { value: "intramammary", labelRu: "Интрамаммарный" },
  { value: "axillary_I", labelRu: "Подмышечный I" },
  { value: "axillary_II", labelRu: "Подмышечный II" },
  { value: "axillary_III", labelRu: "Подмышечный III" },
  { value: "internal_mammary", labelRu: "Внутренний грудной" },
  { value: "supraclavicular", labelRu: "Надключичный" },
];
const LN_ASSESSMENT: { value: BreastLymphAssessment; labelRu: string }[] = [
  { value: "normal", labelRu: "Без особенностей" },
  { value: "indeterminate", labelRu: "Неопределённый" },
  { value: "suspicious", labelRu: "Подозрительный" },
];
/** ACR hierarchy for the combined hint: 1 < 2 < 3 < 6 < 0 < 4 < 5. */
const RANK: Record<BiradsCategory, number> = { "1": 1, "2": 2, "3": 3, "6": 4, "0": 5, "4A": 6, "4B": 7, "4C": 8, "5": 9 };

let seq = 1;
const newLesion = (side?: BreastSide): BreastLesion => ({ id: `lesion-${seq++}`, side, findings: {} });

type Props = { onCategoryHint?: (category: string | null) => void };

export function BreastUsModule({ onCategoryHint }: Props) {
  const [study, setStudy] = useState<BreastStudyInput>(() => ({ sidesExamined: ["right", "left"], lesions: [newLesion("right")], lymphNodes: [] }));
  const [activeId, setActiveId] = useState(study.lesions[0]?.id ?? "");

  const evaluation = useMemo(() => evaluateBreastStudy(study), [study]);
  const report = useMemo(() => generateBreastReport(study, evaluation), [study, evaluation]);
  const active = study.lesions.find((l) => l.id === activeId) ?? study.lesions[0];
  const activeResult = evaluation.lesions.find((l) => l.lesionId === active?.id)?.result;

  useEffect(() => {
    if (!onCategoryHint) return;
    let best: BiradsCategory | null = null;
    for (const s of evaluation.sides) {
      if (s.status === "final" && (best === null || RANK[s.info.category] > RANK[best])) best = s.info.category;
    }
    onCategoryHint(best ? `BI-RADS ${best}` : null);
  }, [evaluation, onCategoryHint]);

  const updateLesion = (next: BreastLesion) => setStudy((s) => ({ ...s, lesions: s.lesions.map((l) => (l.id === next.id ? next : l)) }));
  const toggleSide = (side: BreastSide) =>
    setStudy((s) => ({
      ...s,
      sidesExamined: s.sidesExamined.includes(side) ? s.sidesExamined.filter((x) => x !== side) : [...s.sidesExamined, side],
    }));
  const lymph = study.lymphNodes ?? [];
  const setLymph = (next: BreastLymphNodeFinding[]) => setStudy((s) => ({ ...s, lymphNodes: next }));

  const fullText = [
    report.descriptionRu,
    "",
    "Заключение:",
    report.conclusionRu,
    report.recommendationsRu ? `\nРекомендации:\n${report.recommendationsRu}` : "",
    report.warningsRu.length ? `\nВнимание:\n${report.warningsRu.join("\n")}` : "",
    "",
    report.disclaimerRu,
  ].join("\n");

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 lg:px-10" data-e2e-breast-us-module>
      <h2 className="sr-only">BI-RADS УЗИ · ACR v2025</h2>
      <CalcStepCard title="Исследование">
        <CalcSubLabel>Осмотренные железы</CalcSubLabel>
        <div className="flex flex-wrap gap-2">
          <CalcChip label="Правая" selected={study.sidesExamined.includes("right")} onClick={() => toggleSide("right")} />
          <CalcChip label="Левая" selected={study.sidesExamined.includes("left")} onClick={() => toggleSide("left")} />
        </div>
        <CalcSubLabel>Образования</CalcSubLabel>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Образования">
            {study.lesions.map((l, i) => {
              const r = evaluation.lesions.find((e) => e.lesionId === l.id)?.result;
              const cat = r?.status === "ok" ? (r.final ? `BI-RADS ${r.final.category}` : "выбор врача") : null;
              return (
                <button
                  key={l.id}
                  type="button"
                  role="tab"
                  aria-selected={l.id === active?.id}
                  onClick={() => setActiveId(l.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs font-bold transition",
                    l.id === active?.id
                      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
                      : "clinical-surface hover:border-[var(--clinical-primary)]",
                  )}
                >
                  Образование {i + 1}
                  {l.side ? ` · ${SIDE_SHORT[l.side]}` : ""}
                  {cat ? ` · ${cat}` : ""}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const l = newLesion(active?.side);
              setStudy((s) => ({ ...s, lesions: [...s.lesions, l] }));
              setActiveId(l.id);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
            Образование
          </Button>
          {active ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Удалить текущее образование"
              onClick={() => {
                setStudy((s) => ({ ...s, lesions: s.lesions.filter((l) => l.id !== active.id) }));
                setActiveId(study.lesions.find((l) => l.id !== active.id)?.id ?? "");
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
        {study.lesions.length === 0 ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Образований нет — осмотренные железы получат BI-RADS 1.</p>
        ) : null}
      </CalcStepCard>

      {active ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <BreastLesionForm lesion={active} onChange={updateLesion} />
          <div className="lg:sticky lg:top-20 lg:self-start">
            {activeResult ? (
              <BreastLesionResultCard
                result={activeResult}
                doctorCategory={active.findings.doctorCategory}
                onDoctorCategory={(doctorCategory) => updateLesion({ ...active, findings: { ...active.findings, doctorCategory } })}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <CalcStepCard title="Регионарные лимфоузлы (оцениваются отдельно)">
        {lymph.map((n, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-[var(--clinical-border)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["right", "left"] as const).map((side) => (
                <CalcChip key={side} label={side === "right" ? "Справа" : "Слева"} selected={n.side === side} onClick={() => setLymph(lymph.map((x, j) => (j === i ? { ...x, side } : x)))} />
              ))}
              <Button type="button" size="sm" variant="ghost" aria-label="Удалить лимфоузел" onClick={() => setLymph(lymph.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATIONS.map((s) => (
                <CalcChip key={s.value} label={s.labelRu} selected={n.station === s.value} onClick={() => setLymph(lymph.map((x, j) => (j === i ? { ...x, station: s.value } : x)))} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {LN_ASSESSMENT.map((a) => (
                <CalcChip key={a.value} label={a.labelRu} selected={n.assessment === a.value} onClick={() => setLymph(lymph.map((x, j) => (j === i ? { ...x, assessment: a.value } : x)))} />
              ))}
            </div>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setLymph([...lymph, { side: active?.side ?? "right", station: "axillary_I", assessment: "normal" }])}>
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
          Лимфоузел
        </Button>
      </CalcStepCard>

      {evaluation.errors.length ? (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100">
          {evaluation.errors.map((e) => e.messageRu).join(" ")}
        </p>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4" data-e2e-breast-report>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-[var(--clinical-foreground)]">Описание и заключение УЗИ</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(fullText).then(() => toast.success("Заключение скопировано"))}>
            <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
            Скопировать
          </Button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--clinical-foreground)]">{report.descriptionRu}</pre>
        <div>
          <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">Заключение</p>
          <pre className="whitespace-pre-wrap font-sans text-sm font-semibold leading-relaxed text-[var(--clinical-foreground)]">{report.conclusionRu}</pre>
        </div>
        {report.recommendationsRu ? (
          <div>
            <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">Рекомендации</p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--clinical-foreground)]">{report.recommendationsRu}</pre>
          </div>
        ) : null}
        {report.warningsRu.length ? (
          <ul className="list-inside list-disc text-xs text-amber-900 dark:text-amber-200">
            {report.warningsRu.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        <details className="text-xs text-[var(--clinical-foreground-muted)]">
          <summary className="cursor-pointer font-semibold">Источники</summary>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {report.sourcesRu.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{report.disclaimerRu}</p>
      </section>
      <ClinicalCdssDisclaimer />
    </div>
  );
}

export function BreastCategoryReference() {
  return (
    <div className="space-y-2">
      {(["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"] as const).map((c) => (
        <div key={c} className="rounded-xl border border-[var(--clinical-border)] p-3 text-sm">
          <p className="font-black">{BIRADS_CATEGORY_INFO[c].labelRu}</p>
          <p className="mt-1 text-xs">Вероятность злокачественности: {BIRADS_CATEGORY_INFO[c].likelihoodRu}</p>
          <p className="text-xs">{BIRADS_CATEGORY_INFO[c].managementRu}</p>
        </div>
      ))}
      <p className="text-[11px] text-[var(--clinical-foreground-muted)]">ACR BI-RADS® Atlas 5th ed. (2013) · v2025 Manual.</p>
    </div>
  );
}
