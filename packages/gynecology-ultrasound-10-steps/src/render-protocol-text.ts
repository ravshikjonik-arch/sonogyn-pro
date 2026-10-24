import { evaluateVolumeFormula, formatNumber } from "./compute";
import { getOrderedSteps } from "./module";
import type { ProtocolDraftState, RepeatableItemState, StepState } from "./types";

type FieldDef = Record<string, unknown>;

function isTruthyValue(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return !Number.isNaN(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

function fillTemplate(template: string, values: Record<string, string>): string | null {
  let missing = false;
  const out = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = values[key];
    if (!val) {
      missing = true;
      return "";
    }
    return val;
  });
  if (missing || !out.trim()) return null;
  return out.replace(/\s+/g, " ").trim();
}

function measurementValues(raw: unknown): Record<string, number | undefined> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number | undefined> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
    }
  }
  return out;
}

function stringValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === null || v === undefined || v === "") continue;
    out[k] = String(v);
  }
  return out;
}

function renderFieldLines(field: FieldDef, state: StepState, lines: string[]): void {
  const id = String(field.id ?? "");
  const type = String(field.type ?? "");
  const label = String(field.label ?? id);
  const value = state[id];

  if (type === "boolean" && value === true) {
    const reportText = field.reportText;
    if (typeof reportText === "string" && reportText.trim()) lines.push(reportText.trim());
    return;
  }

  if (type === "singleSelect" && typeof value === "string" && value.trim()) {
    lines.push(`${label}: ${value.trim()}.`);
    return;
  }

  if ((type === "number" || type === "integer") && value !== undefined && value !== "") {
    const unit = field.unit ? ` ${field.unit}` : "";
    lines.push(`${label}: ${value}${unit}.`);
    return;
  }

  if (type === "measurementGroup" && value) {
    const m = measurementValues(value);
    const parts = Object.entries(m)
      .map(([k, n]) => `${k} ${formatNumber(n!)}`)
      .join(", ");
    if (parts) lines.push(`${label}: ${parts}.`);
    const template = field.template;
    if (typeof template === "string") {
      const filled = fillTemplate(
        template,
        Object.fromEntries(Object.entries(m).map(([k, n]) => [k, formatNumber(n!)])),
      );
      if (filled) lines.push(filled);
    }
    return;
  }

  if (type === "computed") {
    const formula = String(field.formula ?? "");
    const deps = measurementValues(state.dimensions ?? state);
    const result = evaluateVolumeFormula(formula, deps);
    if (result != null) {
      const unit = field.unit ? ` ${field.unit}` : "";
      lines.push(`${label}: ${formatNumber(result)}${unit}.`);
    }
    return;
  }

  if (type === "measurementTemplate" && value && typeof value === "object") {
    const enabled = (value as { enabled?: boolean }).enabled;
    if (enabled === false) return;
    const template = String(field.template ?? "");
    const merged = {
      ...stringValues((value as { inputs?: unknown }).inputs),
      ...Object.fromEntries(
        Object.entries(measurementValues((value as { measurements?: unknown }).measurements)).map(([k, n]) => [
          k,
          formatNumber(n!),
        ]),
      ),
    };
    const filled = fillTemplate(template, merged);
    if (filled) lines.push(filled);
    return;
  }

  if (type === "group" && value && typeof value === "object") {
    const groupState = value as StepState;
    const fields = field.fields;
    if (Array.isArray(fields)) {
      for (const child of fields as FieldDef[]) renderFieldLines(child, groupState, lines);
    }
    const variants = field.variants;
    if (Array.isArray(variants)) {
      const variantId = groupState._variant as string | undefined;
      const picked = variants.find((v) => (v as FieldDef).id === variantId) as FieldDef | undefined;
      if (picked?.template && typeof picked.template === "string") {
        const m = measurementValues(groupState.measurements);
        const filled = fillTemplate(
          picked.template,
          Object.fromEntries(Object.entries(m).map(([k, n]) => [k, formatNumber(n!)])),
        );
        if (filled) lines.push(filled);
      }
    }
    const template = field.template;
    if (typeof template === "string") {
      const filled = fillTemplate(template, stringValues(groupState));
      if (filled) lines.push(filled);
    }
    return;
  }

  if (type === "repeatableGroup" && Array.isArray(value)) {
    const items = value as RepeatableItemState[];
    items.forEach((item, index) => {
      const itemLines: string[] = [];
      const fields = field.fields;
      if (Array.isArray(fields)) {
        for (const child of fields as FieldDef[]) renderFieldLines(child, item.values, itemLines);
      }
      const sourceTemplate = field.sourceTemplate;
      if (typeof sourceTemplate === "string" && itemLines.length === 0) {
        itemLines.push(sourceTemplate);
      }
      if (itemLines.length) {
        lines.push(`${label} ${index + 1}: ${itemLines.join(" ")}`);
      }
    });
    return;
  }

  if (type === "textTemplate" && value && typeof value === "object") {
    const template = String(field.template ?? "");
    const filled = fillTemplate(template, stringValues(value));
    if (filled) lines.push(filled);
  }
}

function renderOvariesStep(stepState: StepState, lines: string[]): void {
  for (const side of ["right", "left"] as const) {
    const sideState = stepState[side];
    if (!sideState || typeof sideState !== "object") continue;
    const sideLabel = side === "right" ? "Правый яичник" : "Левый яичник";
    const sideLines: string[] = [];
    const fields = (getOrderedSteps().find((s) => s.id === "ovaries")?.fields ?? []) as FieldDef[];
    for (const field of fields) renderFieldLines(field, sideState as StepState, sideLines);
    if (sideLines.length) {
      lines.push(`${sideLabel}. ${sideLines.join(" ")}`);
    }
  }
}

export function renderProtocolText(state: ProtocolDraftState): string {
  const sections: string[] = [];
  const disclaimer =
    "Текст собран из выбранных формулировок источника. Не является диагнозом; интерпретация — лечащим специалистом.";

  for (const step of getOrderedSteps()) {
    const stepState = state.steps[step.id];
    if (!stepState) continue;

    const lines: string[] = [];
    if (step.id === "ovaries") {
      renderOvariesStep(stepState, lines);
    } else if (Array.isArray(step.fields)) {
      for (const field of step.fields as FieldDef[]) renderFieldLines(field, stepState, lines);
    }

    if (lines.length) {
      sections.push(`${step.order}. ${step.title}\n${lines.map((l) => `• ${l}`).join("\n")}`);
    }
  }

  if (!sections.length) return disclaimer;
  return `${sections.join("\n\n")}\n\n${disclaimer}`;
}

export function stepCompletionHint(stepId: string, stepState: StepState | undefined): "empty" | "partial" | "filled" {
  if (!stepState) return "empty";
  const hasAny = Object.values(stepState).some(isTruthyValue);
  if (!hasAny) return "empty";
  return "partial";
}
