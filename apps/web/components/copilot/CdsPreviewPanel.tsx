"use client";

import { useState } from "react";
import type { OrchestratorResult } from "@/lib/ai/types";

export function CdsPreviewPanel(props: { studyId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestratorResult | null>(null);

  async function runPreview() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/copilot/studies/${props.studyId}/cds-preview`,
        { method: "POST" },
      );

      const payload = (await response.json()) as {
        cds?: OrchestratorResult;
        error?: string;
      };

      if (!response.ok || !payload.cds) {
        setError(payload.error ?? "Не удалось получить CDS черновик");
        return;
      }

      setResult(payload.cds);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Clinical decision support
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Мультиагентный черновик (stub)
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Объединение гипотез, конфликтов и резюме. Выводы всегда формулируются как
            «клинические поддерживающие предложения».
          </p>
        </div>

        <button
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="button"
          onClick={() => void runPreview()}
        >
          {loading ? "Запуск..." : "Сгенерировать превью"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          {result.contradictions.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-bold">Возможные противоречия</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.contradictions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <p className="font-bold text-slate-950">Исполнительное резюме</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {result.executiveSummary}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {result.agents.map((agent) => (
              <article
                key={agent.agent}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {agent.agent.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {agent.bundle.summary}
                </p>
                {agent.warnings.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-semibold text-red-700">
                    {agent.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
