"use client";

import type { SonogynStructuredResponse } from "@/lib/ai/sonogyn-chat/structured-response";

type Props = {
  data: SonogynStructuredResponse;
};

export function SonogynStructuredCard({ data }: Props) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 text-xs">
      {data.classification_system && data.category ? (
        <p className="font-bold text-amber-300">
          {data.classification_system}: {data.category}
        </p>
      ) : null}
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
