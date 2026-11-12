"use client";

import { useId, useState } from "react";

import { toolStatusLabel } from "@/lib/ai/sonogyn-chat/tool-results";
import { INPUT_STATE_LABELS, type InputReview } from "@/lib/ai/sonogyn-chat/tools/input-review";
import type { ToolExecutionResult } from "@/lib/ai/sonogyn-chat/tools/schemas";

const TOOL_LABELS: Record<string, string> = {
  calculate_orads: "O-RADS US engine",
  calculate_birads: "BI-RADS US engine",
  calculate_tirads: "ACR TI-RADS engine",
  calculate_adnex: "IOTA ADNEX model",
  calculate_lr2: "IOTA LR2 model",
  calculate_srrisk: "IOTA Simple Rules Risk",
  assess_fmf_screening: "FMF percentile engine",
};

function formatValue(value: unknown): string {
  if (value === true) return "да";
  if (value === false) return "нет";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function InputList({ review }: { review: InputReview }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {review.fields.map((f) => (
        <li key={f.field} className="text-[var(--clinical-foreground)]">
          <span className="font-mono">{f.field}</span>: {formatValue(f.value)}{" "}
          <span className="text-[var(--clinical-foreground-muted)]">({INPUT_STATE_LABELS[f.state]})</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Physician review of model-supplied inputs. Nothing is pre-selected: the physician ticks the fields to confirm;
 * unticked fields are excluded from the calculation. Values cannot be edited here (corrections go through the chat).
 */
function ReviewPanel({ tool, onConfirmed }: { tool: ToolExecutionResult; onConfirmed: (r: ToolExecutionResult) => void }) {
  const review = tool.inputReview!;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const legendId = useId();

  const toggle = (field: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const input = Object.fromEntries(review.fields.map((f) => [f.field, f.value]));
      const res = await fetch("/api/ai/tools/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tool: tool.tool, input, confirmedFields: [...selected] }),
      });
      const data = (await res.json().catch(() => null)) as { result?: ToolExecutionResult } | null;
      if (!res.ok || !data?.result) throw new Error("confirm_failed");
      onConfirmed(data.result);
    } catch {
      setError("Не удалось выполнить расчёт. Повторите попытку.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset aria-labelledby={legendId} className="mt-2 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-2">
      <legend id={legendId} className="px-1 font-semibold text-[var(--clinical-foreground)]">
        Подтвердите входные данные перед расчётом
      </legend>
      <p className="text-[var(--clinical-foreground-muted)]">
        Значения переданы AI-моделью. Отметьте только те, что соответствуют исследованию; неотмеченные в расчёт не войдут.
      </p>
      <ul className="mt-1 space-y-1">
        {review.fields.map((f) => {
          const id = `${legendId}-${f.field}`;
          return (
            <li key={f.field} className="flex items-start gap-1.5">
              <input
                id={id}
                type="checkbox"
                className="mt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--clinical-primary)]"
                checked={selected.has(f.field)}
                onChange={() => toggle(f.field)}
              />
              <label htmlFor={id} className="text-[var(--clinical-foreground)]">
                <span className="font-mono">{f.field}</span>: {formatValue(f.value)}{" "}
                <span className="text-[var(--clinical-foreground-muted)]">({INPUT_STATE_LABELS[f.state]})</span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={confirm}
        disabled={busy || selected.size === 0}
        className="mt-2 rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-2 py-1 font-medium text-[var(--clinical-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--clinical-primary)] disabled:opacity-50"
      >
        {busy ? "Расчёт…" : "Подтвердить отмеченные и рассчитать"}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-[var(--clinical-foreground)]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function AiToolResultCard({ tool }: { tool: ToolExecutionResult }) {
  const [current, setCurrent] = useState(tool);
  const status = toolStatusLabel(current);
  const pending = current.review?.state === "pending" && current.ok && Boolean(current.inputReview);
  return (
    <div className="mt-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-[var(--clinical-foreground)]">
          {TOOL_LABELS[current.tool] ?? current.tool}
        </span>
        <span className="rounded-full bg-[var(--clinical-card)] px-1.5 py-0.5 text-[10px] text-[var(--clinical-foreground-muted)]">
          {current.engineVersion}
        </span>
        <span
          className={
            status.tone === "ok"
              ? "text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
              : "text-[10px] font-medium text-amber-700 dark:text-amber-300"
          }
        >
          {status.text}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">{current.sourceLabel}</p>
      {current.error ? (
        <p className="mt-1 text-[var(--clinical-foreground)]">{current.error}</p>
      ) : null}
      {current.limitations?.length ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--clinical-foreground)]">
          {current.limitations.map((note) => (
            <li key={note}>
              <span className="font-medium">Ограничение: </span>
              {note}
            </li>
          ))}
        </ul>
      ) : null}
      {pending ? (
        <ReviewPanel tool={current} onConfirmed={setCurrent} />
      ) : current.inputReview?.fields.length ? (
        <details className="mt-1">
          <summary className="cursor-pointer text-[var(--clinical-foreground-muted)]">Входные данные</summary>
          <InputList review={current.inputReview} />
        </details>
      ) : null}
      {current.result ? (
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[var(--clinical-card)] p-2 text-[10px] text-[var(--clinical-foreground)]">
          {JSON.stringify(current.result, null, 2)}
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
