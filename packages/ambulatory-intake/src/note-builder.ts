import { buildDynamicChecklist } from "./checklist-dynamic";
import {
  AMBULATORY_INTAKE_DISCLAIMER,
  AMBULATORY_INTAKE_SECTIONS,
  CHART_FIELD_IDS,
  CHART_FIELD_LABELS,
  type ChartFieldId,
} from "./catalog";
import { labsForReasons } from "./labs";
import { getRegionProfile } from "./regions";
import { VISIT_REASONS, type VisitReasonId } from "./reasons";
import { scenariosForReasons } from "./scenarios";
import type { AmbulatoryIntakeDraft, ItemState } from "./schemas";

function statusMark(status: ItemState["status"]): string {
  if (status === "done") return "☑";
  if (status === "not_indicated") return "○ не показано";
  return "☐";
}

function lineForItem(label: string, state: ItemState | undefined): string | null {
  const s = state ?? { status: "empty" as const };
  if (s.status === "empty" && !s.note?.trim()) return null;
  const note = s.note?.trim() ? ` — ${s.note.trim()}` : "";
  if (s.status === "empty" && note) return `☐ ${label}${note}`;
  return `${statusMark(s.status)} ${label}${note}`;
}

function reasonIdsOf(draft: AmbulatoryIntakeDraft): VisitReasonId[] {
  return draft.reasonIds.filter((id): id is VisitReasonId =>
    VISIT_REASONS.some((r) => r.id === id),
  );
}

/** Legacy v1 builder kept for full static catalog drafts. */
export function buildChartNoteDraftV1(draft: AmbulatoryIntakeDraft): string {
  const blocks: string[] = [];
  blocks.push("Чек-лист первичного амбулаторного приёма АГ — черновик записи");
  blocks.push(`Обновлено: ${draft.updatedAt}`);
  blocks.push("");

  for (const section of AMBULATORY_INTAKE_SECTIONS) {
    const sectionLines: string[] = [];
    for (const item of section.items ?? []) {
      const line = lineForItem(item.label, draft.itemStates[item.id]);
      if (line) sectionLines.push(`- ${line}`);
    }
    for (const sub of section.subsections ?? []) {
      const subLines: string[] = [];
      for (const item of sub.items) {
        const line = lineForItem(item.label, draft.itemStates[item.id]);
        if (line) subLines.push(`  - ${line}`);
      }
      if (subLines.length > 0) {
        sectionLines.push(`### ${sub.title}`);
        sectionLines.push(...subLines);
      }
    }
    if (sectionLines.length > 0) {
      blocks.push(`## ${section.number}. ${section.title}`);
      blocks.push(...sectionLines);
      blocks.push("");
    }
  }

  blocks.push("## 8. Запись в медицинскую карту — каркас");
  for (const fieldId of CHART_FIELD_IDS) {
    const label = CHART_FIELD_LABELS[fieldId as ChartFieldId];
    const value = draft.chartFields[fieldId]?.trim() || "[внести]";
    blocks.push(`**${label}:** ${value}`);
    blocks.push("");
  }
  blocks.push("---");
  blocks.push(AMBULATORY_INTAKE_DISCLAIMER);
  return `${blocks.join("\n").trim()}\n`;
}

/**
 * Builds a physician chart draft from manually marked checklist items + free-text fields.
 * Never invents clinical facts beyond what the doctor entered.
 */
export function buildChartNoteDraft(draft: AmbulatoryIntakeDraft): string {
  if (draft.version === 1 || draft.reasonIds.length === 0) {
    // Still allow v1 full catalog if no reasons picked
    if (draft.version === 1) return buildChartNoteDraftV1(draft);
  }

  const reasons = reasonIdsOf(draft);
  const region = getRegionProfile(draft.regionCode);
  const sections = buildDynamicChecklist(reasons.length ? reasons : (["primary"] as VisitReasonId[]));
  const labs = labsForReasons(reasons.length ? reasons : ["primary"]);
  const scenarios = scenariosForReasons(reasons);

  const blocks: string[] = [];
  blocks.push("Амбулаторный приём АГ — черновик итога (для врача)");
  blocks.push(`Регион: ${region.labelRu} (${draft.regionCode})`);
  blocks.push(`Обновлено: ${draft.updatedAt}`);
  blocks.push("");

  const reasonLabels = reasons
    .map((id) => VISIT_REASONS.find((r) => r.id === id)?.labelRu ?? id)
    .join("; ");
  blocks.push(`**Причина обращения:** ${reasonLabels || "[не выбрана]"}`);
  blocks.push("");

  for (const section of sections) {
    if (section.id === "reason") continue;
    const lines: string[] = [];
    for (const item of section.items) {
      const line = lineForItem(item.label, draft.itemStates[item.id]);
      if (line) lines.push(`- ${line}`);
    }
    if (lines.length) {
      blocks.push(`## ${section.title}`);
      blocks.push(...lines);
      blocks.push("");
    }
  }

  const labLines: string[] = [];
  for (const item of [...labs.route, ...labs.clinical]) {
    const line = lineForItem(`[${item.tier === "A_route" ? "А" : "Б"}] ${item.labelRu}`, draft.labStates[item.id]);
    if (line) labLines.push(`- ${line}`);
  }
  if (labLines.length) {
    blocks.push("## 4. Лабораторная диагностика (отмечено врачом)");
    blocks.push(...labLines);
    blocks.push("");
  }

  if (scenarios.length) {
    blocks.push("## Клинические сценарии (справочно)");
    for (const s of scenarios.slice(0, 6)) {
      blocks.push(`- ${s.titleRu}`);
    }
    blocks.push("");
  }

  blocks.push("## Запись в медицинскую карту — каркас");
  for (const fieldId of CHART_FIELD_IDS) {
    const label = CHART_FIELD_LABELS[fieldId as ChartFieldId];
    const value = draft.chartFields[fieldId]?.trim() || "[внести]";
    blocks.push(`**${label}:** ${value}`);
    blocks.push("");
  }

  blocks.push("---");
  blocks.push(AMBULATORY_INTAKE_DISCLAIMER);
  blocks.push(
    "Нормативные ссылки требуют статуса VERIFIED; кандидаты ДЗМ/МЗ помечены REVIEW_REQUIRED и не являются подтверждённым основанием назначений.",
  );

  return `${blocks.join("\n").trim()}\n`;
}

export function countMarkedItems(draft: AmbulatoryIntakeDraft): {
  done: number;
  notIndicated: number;
  withNote: number;
} {
  let done = 0;
  let notIndicated = 0;
  let withNote = 0;
  for (const state of Object.values(draft.itemStates)) {
    if (state.status === "done") done += 1;
    if (state.status === "not_indicated") notIndicated += 1;
    if (state.note?.trim()) withNote += 1;
  }
  for (const state of Object.values(draft.labStates ?? {})) {
    if (state.status === "done") done += 1;
    if (state.status === "not_indicated") notIndicated += 1;
  }
  return { done, notIndicated, withNote };
}
