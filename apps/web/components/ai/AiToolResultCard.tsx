"use client";

import type { ToolExecutionResult } from "@/lib/ai/sonogyn-chat/tools/schemas";

const TOOL_LABELS: Record<string, string> = {
  calculate_orads: "O-RADS US engine",
  calculate_birads: "BI-RADS US engine",
  calculate_tirads: "ACR TI-RADS engine",
  assess_fmf_screening: "FMF percentile engine",
};

export function AiToolResultCard({ tool }: { tool: ToolExecutionResult }) {
  return (
    <div className="mt-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-[var(--clinical-foreground)]">
          {TOOL_LABELS[tool.tool] ?? tool.tool}
        </span>
        <span className="rounded-full bg-[var(--clinical-card)] px-1.5 py-0.5 text-[10px] text-[var(--clinical-foreground-muted)]">
          {tool.engineVersion}
        </span>
        {tool.ok ? (
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">OK</span>
        ) : (
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">Нужны данные</span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">{tool.sourceLabel}</p>
      {tool.error ? (
        <p className="mt-1 text-[var(--clinical-foreground)]">{tool.error}</p>
      ) : null}
      {tool.result ? (
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[var(--clinical-card)] p-2 text-[10px] text-[var(--clinical-foreground)]">
          {JSON.stringify(tool.result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function AiToolResultList({ tools }: { tools: ToolExecutionResult[] }) {
  if (!tools.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {tools.map((t, i) => (
        <AiToolResultCard key={`${t.tool}-${i}`} tool={t} />
      ))}
    </div>
  );
}
