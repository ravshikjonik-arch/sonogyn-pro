"use client";

import { AlertTriangle, Info } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const CRITERIA_SECTION_LABELS: Record<string, string> = {
  measurements: "Измерения",
  epitheliumLayers: "Слои эпителия",
  transformationZoneTypes: "Типы зоны трансформации",
  atypicalTransformationZoneSigns: "Признаки атипичной ЗТ",
  colposcopySigns: "Кольпоскопические признаки",
  cytologyClassifications: "Классификации цитологии",
  cinClassification: "Классификация ЦИН",
  epidemiology: "Эпидемиология",
  persistenceRiskFactors: "Факторы риска персистенции",
  treatmentByIndication: "Тактика по показаниям",
  followUpAfterTreatment: "Наблюдение после лечения",
  prognosisUntreated: "Прогноз без лечения",
  prevention: "Профилактика",
  morphologicalTypes: "Морфологические типы",
  stagingOverview: "Стадирование (обзор)",
  stagingWorkup: "Объём обследования",
  clinicalPresentation: "Клиническая картина",
  metastasis: "Метастазирование",
  treatmentByStage: "Лечение по стадии",
  followUpSchedule: "График наблюдения",
  hpvAssociation: "Ассоциация с ВПЧ",
  pharmacologicalOption: "Медикаментозная опция",
};

const SKIP_KEYS = new Set(["chapter", "version", "sourceNote", "cautionNote"]);

type Props = {
  data: Record<string, unknown>;
  className?: string;
};

function collectNotes(data: Record<string, unknown>): Array<{ tone: "info" | "warning"; text: string }> {
  const notes: Array<{ tone: "info" | "warning"; text: string }> = [];
  if (typeof data.sourceNote === "string") notes.push({ tone: "info", text: data.sourceNote });
  if (typeof data.cautionNote === "string") notes.push({ tone: "warning", text: data.cautionNote });

  const pharma = data.pharmacologicalOption;
  if (pharma && typeof pharma === "object" && "cautionNote" in pharma) {
    const note = (pharma as { cautionNote?: string }).cautionNote;
    if (note) notes.push({ tone: "warning", text: note });
  }
  return notes;
}

function objectRows(value: Record<string, unknown>): Array<{ key: string; val: string }> {
  return Object.entries(value).map(([key, val]) => ({
    key,
    val: typeof val === "string" || typeof val === "number" ? String(val) : JSON.stringify(val),
  }));
}

function arrayTableHeaders(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) Object.keys(row).forEach((k) => keys.add(k));
  return Array.from(keys);
}

function humanKey(key: string): string {
  return CRITERIA_SECTION_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function CriteriaPanel({ data, className }: Props) {
  const notes = collectNotes(data);

  return (
    <div className={cn("space-y-4", className)}>
      {notes.map((note) => (
        <div
          key={note.text.slice(0, 48)}
          className={cn(
            "flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
            note.tone === "warning"
              ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100",
          )}
        >
          {note.tone === "warning" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <p>{note.text}</p>
        </div>
      ))}

      {Object.entries(data).map(([key, value]) => {
        if (SKIP_KEYS.has(key)) return null;
        if (key === "pharmacologicalOption" && value && typeof value === "object") {
          const obj = value as Record<string, unknown>;
          return (
            <section key={key} className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] p-4">
              <h3 className="text-sm font-bold">{humanKey(key)}</h3>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                {objectRows(obj)
                  .filter((row) => row.key !== "cautionNote")
                  .map((row) => (
                    <div key={row.key}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                        {row.key}
                      </dt>
                      <dd className="mt-0.5">{row.val}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          );
        }

        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
          const rows = value as Record<string, unknown>[];
          const headers = arrayTableHeaders(rows);
          return (
            <section key={key} className="overflow-x-auto rounded-2xl border border-[var(--clinical-border)]">
              <h3 className="border-b border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-4 py-2 text-sm font-bold">
                {humanKey(key)}
              </h3>
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-[var(--clinical-border)] last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 align-top text-[var(--clinical-foreground-muted)]">
                          {row[h] != null ? String(row[h]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        }

        if (Array.isArray(value) && (value.length === 0 || typeof value[0] === "string")) {
          return (
            <section key={key} className="rounded-2xl border border-[var(--clinical-border)] p-4">
              <h3 className="text-sm font-bold">{humanKey(key)}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                {(value as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          );
        }

        if (value && typeof value === "object" && !Array.isArray(value)) {
          const obj = value as Record<string, unknown>;
          return (
            <section key={key} className="rounded-2xl border border-[var(--clinical-border)] p-4">
              <h3 className="text-sm font-bold">{humanKey(key)}</h3>
              {"mainSymptoms" in obj && Array.isArray(obj.mainSymptoms) ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(obj.mainSymptoms as string[]).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  {objectRows(obj).map((row) => (
                    <div key={row.key}>
                      <dt className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">{row.key}</dt>
                      <dd className="mt-0.5">{row.val}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
