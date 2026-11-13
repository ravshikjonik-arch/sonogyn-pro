"use client";

import { useState } from "react";

import {
  PELVIS_DIE_DISCLAIMER,
  PELVIS_DIE_STRUCTURES,
  type PelvisStructure,
} from "@/lib/clinical/pelvis-die-checklist";

export function PelvisDieChecklistClient() {
  const [activeId, setActiveId] = useState<string>(PELVIS_DIE_STRUCTURES[0]?.id ?? "uterus");
  const active: PelvisStructure | undefined = PELVIS_DIE_STRUCTURES.find((s) => s.id === activeId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">
          Mapping · PELVIS_3D
        </p>
        <h1 className="text-2xl font-black text-[var(--clinical-foreground)]">
          Малый таз · глубина инфильтрации (справочно)
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Каркас модуля: чеклист структур для УЗИ при тазовом инфильтративном эндометриозе. Полная 3D-модель
          подключается отдельно (лицензия — в docs/LICENSES.md).
        </p>
        <p className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-4 py-3 text-sm text-[var(--clinical-foreground-muted)]">
          {PELVIS_DIE_DISCLAIMER}
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="list" aria-label="Структуры малого таза">
        {PELVIS_DIE_STRUCTURES.map((s) => {
          const on = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              role="listitem"
              aria-pressed={on}
              onClick={() => setActiveId(s.id)}
              className={
                on
                  ? "rounded-xl bg-[var(--clinical-primary)] px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-1.5 text-sm font-medium text-[var(--clinical-foreground)]"
              }
            >
              {s.titleRu}
            </button>
          );
        })}
      </div>

      {active ? (
        <section
          className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5"
          aria-live="polite"
        >
          <h2 className="text-lg font-bold text-[var(--clinical-foreground)]">{active.titleRu}</h2>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              На что смотреть на УЗИ
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground)]">
              {active.ultrasoundTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Связанные структуры
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {active.relatedIds.map((id) => {
                const rel = PELVIS_DIE_STRUCTURES.find((s) => s.id === id);
                if (!rel) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className="rounded-lg border border-[var(--clinical-border)] px-2 py-1 text-xs font-medium text-[var(--clinical-foreground)]"
                    onClick={() => setActiveId(id)}
                  >
                    {rel.titleRu}
                  </button>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
