"use client";

import type { CalculatorSystem, StructuredCalculatorBlock } from "@repo/types";
import { CALCULATOR_ALGORITHM_CATALOG } from "@repo/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCalculatorBlock } from "@/lib/structured-editor/document-sanitize";

const SYSTEMS: CalculatorSystem[] = ["O-RADS", "BI-RADS", "TI-RADS", "FIGO", "IOTA", "FMF", "other"];

type Props = {
  onInsert: (block: StructuredCalculatorBlock) => void;
  disabled?: boolean;
};

export function CalculatorInsertPanel({ onInsert, disabled }: Props) {
  const [system, setSystem] = useState<CalculatorSystem>("O-RADS");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");

  const catalog = CALCULATOR_ALGORITHM_CATALOG[system];

  function handleInsert() {
    if (!category.trim() || !summary.trim()) return;
    onInsert(
      createCalculatorBlock({
        system,
        category,
        summary,
      }),
    );
    setCategory("");
    setSummary("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
        Вставка результата калькулятора (только чтение)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Шкала
          <select
            className="h-10 rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3"
            value={system}
            disabled={disabled}
            onChange={(e) => setSystem(e.target.value as CalculatorSystem)}
          >
            {SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Категория
          <Input
            placeholder="напр. O-RADS 4"
            value={category}
            disabled={disabled}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Краткое резюме
        <Input
          placeholder="Кистозно-солидное образование левого яичника…"
          value={summary}
          disabled={disabled}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Источник: {catalog.sourceLabel} · версия {catalog.algorithmVersion}
      </p>
      <Button type="button" size="sm" disabled={disabled || !category.trim() || !summary.trim()} onClick={handleInsert}>
        Вставить блок
      </Button>
    </div>
  );
}

export function CalculatorBlockList({ blocks }: { blocks: StructuredCalculatorBlock[] }) {
  if (!blocks.length) return null;

  return (
    <ul className="space-y-2">
      {blocks.map((block) => (
        <li
          key={block.id}
          className="rounded-lg border border-[var(--clinical-border)] bg-white p-3 text-sm dark:bg-slate-950"
        >
          <p className="font-bold">
            {block.system} · {block.category}
            {block.isAiDraft ? (
              <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">
                [черновик ИИ]
              </span>
            ) : null}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[var(--clinical-foreground-muted)]">{block.summary}</p>
          <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
            {block.sourceLabel} · алгоритм {block.algorithmId} v{block.algorithmVersion}
          </p>
        </li>
      ))}
    </ul>
  );
}
