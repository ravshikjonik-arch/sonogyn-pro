"use client";

import { useCallback } from "react";

import { evaluateVolumeFormula, formatNumber } from "@repo/gynecology-ultrasound-10-steps";
import type { RepeatableItemState, StepState } from "@repo/gynecology-ultrasound-10-steps";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type FieldDef = Record<string, unknown>;

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-bg)] px-3 py-2 text-sm text-[var(--clinical-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

type Props = {
  field: FieldDef;
  state: StepState;
  onChange: (next: StepState) => void;
  depth?: number;
};

function newRepeatableId(): string {
  return `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ProtocolFieldEditor({ field, state, onChange, depth = 0 }: Props) {
  const id = String(field.id ?? "");
  const type = String(field.type ?? "");
  const label = String(field.label ?? id);
  const value = state[id];

  const patch = useCallback(
    (partial: unknown) => {
      onChange({ ...state, [id]: partial });
    },
    [id, onChange, state],
  );

  if (depth > 5) return null;

  if (type === "boolean") {
    return (
      <label className="flex items-center gap-2 py-1 text-sm">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => patch(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--clinical-border)]"
        />
        <span>{label}</span>
      </label>
    );
  }

  if (type === "singleSelect") {
    const options = (field.options as string[]) ?? [];
    return (
      <label className="block py-1">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">{label}</span>
        <select className={inputClass} value={typeof value === "string" ? value : ""} onChange={(e) => patch(e.target.value || undefined)}>
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "number" || type === "integer") {
    const unit = field.unit ? ` (${field.unit})` : "";
    return (
      <label className="block py-1">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">
          {label}
          {unit}
        </span>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => patch(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </label>
    );
  }

  if (type === "text") {
    return (
      <label className="block py-1">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">{label}</span>
        <input
          className={inputClass}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => patch(e.target.value || undefined)}
        />
      </label>
    );
  }

  if (type === "measurementGroup") {
    const measurements = (field.measurements as FieldDef[]) ?? [];
    const group = (value && typeof value === "object" ? value : {}) as StepState;
    return (
      <fieldset className="rounded-xl border border-[var(--clinical-border)] p-3">
        <legend className="px-1 text-sm font-semibold">{label}</legend>
        {measurements.map((m) => (
          <ProtocolFieldEditor
            key={String(m.id)}
            field={m}
            state={group}
            onChange={(next) => patch(next)}
            depth={depth + 1}
          />
        ))}
      </fieldset>
    );
  }

  if (type === "computed") {
    const formula = String(field.formula ?? "");
    const deps = (state.dimensions as StepState | undefined) ?? state;
    const nums: Record<string, number | undefined> = {};
    for (const [k, v] of Object.entries(deps)) {
      if (typeof v === "number") nums[k] = v;
    }
    const result = evaluateVolumeFormula(formula, nums);
    return (
      <p className="py-1 text-sm text-[var(--clinical-foreground-muted)]">
        {label}:{" "}
        <span className="font-semibold text-[var(--clinical-foreground)]">
          {result == null ? "—" : formatNumber(result)}
        </span>
        {field.unit ? ` ${String(field.unit)}` : ""}
      </p>
    );
  }

  if (type === "group") {
    const groupState = (value && typeof value === "object" ? value : {}) as StepState;
    const children = (field.fields as FieldDef[]) ?? [];
    const variants = (field.variants as FieldDef[]) ?? [];
    return (
      <fieldset className="rounded-xl border border-[var(--clinical-border)] p-3">
        <legend className="px-1 text-sm font-semibold">{label}</legend>
        {variants.length ? (
          <label className="mb-2 block">
            <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Вариант</span>
            <select
              className={inputClass}
              value={String(groupState._variant ?? "")}
              onChange={(e) => patch({ ...groupState, _variant: e.target.value || undefined })}
            >
              <option value="">—</option>
              {variants.map((v) => (
                <option key={String(v.id)} value={String(v.id)}>
                  {String(v.label ?? v.id)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {children.map((child) => (
          <ProtocolFieldEditor
            key={String(child.id)}
            field={child}
            state={groupState}
            onChange={(next) => patch(next)}
            depth={depth + 1}
          />
        ))}
      </fieldset>
    );
  }

  if (type === "repeatableGroup") {
    const items = (Array.isArray(value) ? value : []) as RepeatableItemState[];
    const children = (field.fields as FieldDef[]) ?? [];
    return (
      <div className="space-y-3 py-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => patch([...items, { id: newRepeatableId(), values: {} }])}
          >
            Добавить
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-[var(--clinical-border)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--clinical-foreground-muted)]">#{index + 1}</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => patch(items.filter((x) => x.id !== item.id))}
              >
                Удалить
              </button>
            </div>
            {children.map((child) => (
              <ProtocolFieldEditor
                key={String(child.id)}
                field={child}
                state={item.values}
                onChange={(next) => {
                  patch(items.map((x) => (x.id === item.id ? { ...x, values: next } : x)));
                }}
                depth={depth + 1}
              />
            ))}
            {String(field.id) === "formations" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a href="/tools/calc/rads/o-rads" target="_blank" rel="noopener noreferrer">
                    O-RADS (модуль платформы)
                  </a>
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a href="/tools/calc/rads/iota" target="_blank" rel="noopener noreferrer">
                    IOTA ADNEX
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (type === "measurementTemplate" || type === "textTemplate") {
    const tplState = (value && typeof value === "object" ? value : { enabled: false }) as StepState & {
      enabled?: boolean;
    };
    const measurements = (field.measurements as FieldDef[]) ?? [];
    const inputs = (field.inputs as FieldDef[]) ?? [];
    return (
      <fieldset className={cn("rounded-xl border p-3", tplState.enabled ? "border-[var(--clinical-primary)]" : "border-[var(--clinical-border)]")}>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={tplState.enabled === true}
            onChange={(e) => patch({ ...tplState, enabled: e.target.checked })}
          />
          {label}
        </label>
        {tplState.enabled ? (
          <div className="mt-2 space-y-1">
            {inputs.map((inp) => (
              <ProtocolFieldEditor
                key={String(inp.id)}
                field={inp}
                state={(tplState.inputs as StepState) ?? {}}
                onChange={(next) => patch({ ...tplState, inputs: next })}
                depth={depth + 1}
              />
            ))}
            {measurements.map((m) => (
              <ProtocolFieldEditor
                key={String(m.id)}
                field={m}
                state={(tplState.measurements as StepState) ?? {}}
                onChange={(next) => patch({ ...tplState, measurements: next })}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : null}
      </fieldset>
    );
  }

  if (type === "externalModuleResult") {
    return (
      <label className="block py-1">
        <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">{label}</span>
        <input
          className={inputClass}
          type="text"
          placeholder="Вставьте результат из модуля O-RADS / IOTA"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => patch(e.target.value || undefined)}
        />
      </label>
    );
  }

  return null;
}
