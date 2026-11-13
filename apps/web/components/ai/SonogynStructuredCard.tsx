"use client";

import {
  describeTextClaim,
  findTextCategoryClaims,
  NOT_CALCULATED_LABEL,
  notCalculatedReasonText,
  reconcileStructuredCategory,
} from "@/lib/ai/sonogyn-chat/clinical-safety";
import type { SonogynStructuredResponse } from "@/lib/ai/sonogyn-chat/structured-response";
import type { ToolExecutionResult } from "@/lib/ai/sonogyn-chat/tools/schemas";

type Props = {
  data: SonogynStructuredResponse;
  /** Tool results of the same answer; the only source of a displayed category. */
  tools?: ToolExecutionResult[];
};

function CategoryLine({ data, tools }: Required<Props>) {
  const view = reconcileStructuredCategory(data, tools);
  if (!view) return null;
  const system = view.system ?? data.classification_system ?? "Классификация";
  if (view.kind === "engine") {
    return (
      <div className="space-y-1">
        <p className="font-bold text-amber-300">
          {system}: {view.label}{" "}
          <span className="font-normal text-slate-300">
            ({view.provisional ? "предварительный расчёт клинического движка" : "рассчитано клиническим движком"})
          </span>
        </p>
        {view.mismatch && view.modelCategory ? (
          <p role="alert" className="text-amber-200">
            Внимание: модель указала «{view.modelCategory}», что не совпадает с расчётом движка. Показан результат движка.
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="font-bold text-slate-200">
        {system}: {NOT_CALCULATED_LABEL}{" "}
        <span className="font-normal text-slate-400">({notCalculatedReasonText(view.reason)})</span>
      </p>
      {view.modelCategory ? (
        <p className="text-slate-400">Предположение модели «{view.modelCategory}» не является результатом расчёта.</p>
      ) : null}
    </div>
  );
}

export function SonogynStructuredCard({ data, tools = [] }: Props) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 text-xs">
      <CategoryLine data={data} tools={tools} />
      {data.findings_summary_ru ? (
        <p className="text-slate-200">{data.findings_summary_ru}</p>
      ) : null}
      {data.criteria_met_ru?.length ? (
        <ul className="list-inside list-disc text-slate-400">
          {data.criteria_met_ru.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
      {data.recommendation_ru ? (
        <p className="text-slate-300">
          <span className="font-semibold text-slate-200">Рекомендация: </span>
          {data.recommendation_ru}
        </p>
      ) : null}
      {data.confidence_caveat_ru ? (
        <p className="italic text-slate-500">{data.confidence_caveat_ru}</p>
      ) : null}
    </div>
  );
}

/** Categories written in the answer text that no completed engine result supports (or that contradict it). */
export function ClinicalTextSafetyBanner({ text, tools = [] }: { text: string; tools?: ToolExecutionResult[] }) {
  const warnings = findTextCategoryClaims(text, tools);
  if (!warnings.length) return null;
  return (
    <div
      role="note"
      className="mt-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-2 text-xs text-[var(--clinical-foreground)]"
    >
      <p className="font-semibold">Проверка категорий</p>
      <ul className="mt-0.5 list-disc pl-4">
        {warnings.map((w) => (
          <li key={`${w.system}-${w.claim}`}>{describeTextClaim(w)}</li>
        ))}
      </ul>
    </div>
  );
}
