"use client";

import type { PregnancyObstetricContext, TriState } from "@repo/orads-us/pregnancy";
import {
  resolveObstetricSummary,
  type MorphologyDynamics,
  type SizeDynamics,
} from "@repo/orads-us/pregnancy";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: PregnancyObstetricContext;
  onChange: (next: PregnancyObstetricContext) => void;
  className?: string;
};

const selectClass =
  "mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-2 text-sm text-[var(--clinical-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

function FieldLabel({ children }: { children: string }) {
  return <span className="text-sm font-medium text-[var(--clinical-foreground)]">{children}</span>;
}

function parseOptionalInt(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Этап B: срок → автотриместр + клинический акушерский контекст. */
export function OradsPregnancyObstetricFields({ value, onChange, className }: Props) {
  const summary = resolveObstetricSummary(value);

  function patch(partial: Partial<PregnancyObstetricContext>) {
    onChange({ ...value, ...partial });
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 sm:p-4",
        className,
      )}
      data-e2e-orads-pregnancy-obstetric
      aria-label="Акушерский контекст"
    >
      <h3 className="text-sm font-semibold text-[var(--clinical-foreground)]">
        Акушерский контекст
      </h3>
      <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
        Срок задаёт триместр автоматически (I &lt; 14 нед · II 14–27 · III ≥ 28).
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <FieldLabel>Срок, недели</FieldLabel>
          <Input
            type="number"
            min={0}
            max={45}
            inputMode="numeric"
            className="mt-1"
            value={value.gestationalWeeks ?? ""}
            onChange={(e) => patch({ gestationalWeeks: parseOptionalInt(e.target.value) })}
            data-e2e-orads-ga-weeks
            aria-label="Срок беременности в неделях"
          />
        </label>
        <label className="block text-sm">
          <FieldLabel>Дни (0–6)</FieldLabel>
          <Input
            type="number"
            min={0}
            max={6}
            inputMode="numeric"
            className="mt-1"
            value={value.gestationalDays ?? ""}
            onChange={(e) => patch({ gestationalDays: parseOptionalInt(e.target.value) })}
            data-e2e-orads-ga-days
            aria-label="Дни сверх недель"
          />
        </label>
        <div className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-3 py-2">
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Триместр</p>
          <p
            className="mt-0.5 text-sm font-semibold text-[var(--clinical-foreground)]"
            data-e2e-orads-trimester={summary.trimester ?? ""}
          >
            {summary.trimesterLabel ?? "— укажите срок"}
          </p>
          {summary.gaLabel ? (
            <p className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]">{summary.gaLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <FieldLabel>Срок обнаружения (нед.)</FieldLabel>
          <Input
            type="number"
            min={0}
            max={45}
            inputMode="numeric"
            className="mt-1"
            value={value.discoveryGestationalWeeks ?? ""}
            onChange={(e) =>
              patch({ discoveryGestationalWeeks: parseOptionalInt(e.target.value) })
            }
            aria-label="Срок обнаружения образования в неделях"
          />
        </label>
        <label className="block text-sm">
          <FieldLabel>Предыдущие УЗИ</FieldLabel>
          <select
            className={selectClass}
            value={value.priorUltrasound}
            onChange={(e) => patch({ priorUltrasound: e.target.value as TriState })}
          >
            <option value="unknown">Не указано</option>
            <option value="yes">Есть</option>
            <option value="no">Нет</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <FieldLabel>Размеры в динамике</FieldLabel>
          <select
            className={selectClass}
            value={value.sizeDynamics}
            onChange={(e) => patch({ sizeDynamics: e.target.value as SizeDynamics })}
          >
            <option value="unknown">Не указано</option>
            <option value="not_applicable">Нет сравнения</option>
            <option value="stable">Без динамики</option>
            <option value="increased">Увеличение</option>
            <option value="decreased">Уменьшение</option>
          </select>
        </label>
        <label className="block text-sm">
          <FieldLabel>Морфология в динамике</FieldLabel>
          <select
            className={selectClass}
            value={value.morphologyDynamics}
            onChange={(e) => patch({ morphologyDynamics: e.target.value as MorphologyDynamics })}
          >
            <option value="unknown">Не указано</option>
            <option value="not_applicable">Нет сравнения</option>
            <option value="unchanged">Без изменений</option>
            <option value="changed">Изменилась</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { key: "clinicalSymptoms" as const, label: "Клинические симптомы" },
            { key: "pain" as const, label: "Болевой синдром" },
            { key: "torsionSuspect" as const, label: "Подозрение на перекрут" },
            { key: "ruptureSuspect" as const, label: "Подозрение на разрыв" },
          ] as const
        ).map((f) => (
          <label key={f.key} className="block text-sm">
            <FieldLabel>{f.label}</FieldLabel>
            <select
              className={selectClass}
              value={value[f.key]}
              onChange={(e) => patch({ [f.key]: e.target.value as TriState })}
            >
              <option value="unknown">Не указано</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
