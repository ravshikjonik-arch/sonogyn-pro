"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  PREGNANCY_MEDICATIONS,
  PREGNANCY_MEDS_DISCLAIMER,
  searchPregnancyMedications,
  type PregnancyDrugCategory,
  type PregnancyMedication,
} from "@repo/medical-calculations";

const CAT_COLORS: Record<PregnancyDrugCategory, string> = {
  A: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100",
  B: "bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-100",
  C: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  D: "bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100",
  X: "bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100",
  N: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
};

const FILTERS: Array<{ id: "all" | PregnancyDrugCategory; label: string }> = [
  { id: "all", label: "Все" },
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "D", label: "D" },
  { id: "X", label: "X" },
];

export function DoctorPharmacy() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | PregnancyDrugCategory>("all");
  const [selectedId, setSelectedId] = useState(PREGNANCY_MEDICATIONS[0]?.id ?? "");

  const items = useMemo(() => {
    const found = searchPregnancyMedications(query);
    if (category === "all") return found;
    return found.filter((item) => item.category === category);
  }, [query, category]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8" data-e2e-doctor-pharmacy>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">Справочник</p>
        <h1 className="text-3xl font-black tracking-tight">Аптека врача</h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Выберите препарат. Категория, срок и тактика берутся из справочника беременности, не из отдельного списка на экране.
        </p>
      </header>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        <Input
          className="pl-10"
          placeholder="Препарат или симптом: парацетамол, тошнота, варфарин"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Поиск препарата"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Категория FDA">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              category === filter.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)] text-[var(--clinical-primary-foreground)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)]"
            }`}
            onClick={() => setCategory(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ul className="max-h-[32rem] space-y-2 overflow-auto pr-1">
          {items.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[var(--clinical-border)] p-4 text-sm text-[var(--clinical-foreground-muted)]">
              Такого препарата в справочнике нет.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <DrugButton item={item} active={selected?.id === item.id} onSelect={setSelectedId} />
              </li>
            ))
          )}
        </ul>
        <DrugCard item={selected} />
      </div>

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{PREGNANCY_MEDS_DISCLAIMER}</p>
    </div>
  );
}

function DrugButton({
  item,
  active,
  onSelect,
}: {
  item: PregnancyMedication;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)]"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)]"
      }`}
    >
      <span>
        <span className="block font-bold">{item.nameRu}</span>
        <span className="text-xs text-[var(--clinical-foreground-muted)]">{item.name}</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${CAT_COLORS[item.category]}`}>{item.category}</span>
    </button>
  );
}

function DrugCard({ item }: { item: PregnancyMedication | null }) {
  if (!item) {
    return (
      <article className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5 text-sm text-[var(--clinical-foreground-muted)]">
        Выберите препарат слева.
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5" data-e2e-pharmacy-drug={item.id}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black">{item.nameRu}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-black ${CAT_COLORS[item.category]}`}>{item.category}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{item.name}</p>
      <p className="mt-4 text-sm font-semibold">{CATEGORY_LABELS[item.category]}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Срок</dt>
          <dd className="mt-1">{item.trimesterNotes}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Ориентир</dt>
          <dd className="mt-1">{item.summary}</dd>
        </div>
        {item.alternatives ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Альтернатива</dt>
            <dd className="mt-1 font-semibold text-[var(--clinical-primary-deep)]">{item.alternatives}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
