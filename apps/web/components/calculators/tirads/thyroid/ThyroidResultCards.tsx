"use client";

import type { AcrStrictResult, EuTiradsResult } from "@repo/tirads-acr";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const FIELD_RU: Record<string, string> = {
  composition: "состав",
  echogenicity: "эхогенность",
  shape: "форма",
  margins: "контуры",
  margin: "контуры",
  microcalcifications: "микрокальцинаты",
  echogenicFoci: "эхогенные включения",
};

const FNA_RU = {
  indicated: { text: "ТАБ показана", tone: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100" },
  consider: { text: "ТАБ рассмотреть", tone: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" },
  not_indicated: { text: "ТАБ не показана", tone: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100" },
  undetermined: { text: "Показания к ТАБ не определены", tone: "border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 text-[var(--clinical-foreground)]" },
} as const;

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">{title}</p>
      {children}
    </section>
  );
}

function Pending({ title, text }: { title: string; text: string }) {
  return (
    <Shell title={title}>
      <p className="rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-4 text-sm text-[var(--clinical-foreground-muted)]">{text}</p>
    </Shell>
  );
}

function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((w) => (
        <li
          key={w}
          className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}

function Management({ fna, reason, followUp, source }: { fna: keyof typeof FNA_RU; reason: string; followUp: string | null; source: string }) {
  const f = FNA_RU[fna];
  return (
    <div className="space-y-2">
      <div className={cn("rounded-xl border px-3 py-2 text-sm", f.tone)}>
        <p className="font-bold">{f.text}</p>
        <p className="mt-0.5 text-xs">{reason}</p>
      </div>
      {followUp ? (
        <p className="text-sm text-[var(--clinical-foreground)]">
          <span className="font-semibold">Наблюдение: </span>
          {followUp}
        </p>
      ) : null}
      <p className="text-[11px] text-[var(--clinical-foreground-muted)]">Источник: {source}</p>
    </div>
  );
}

function CategoryBadge({ label, risk }: { label: string; risk: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className="text-2xl font-black text-[var(--clinical-foreground)]" data-e2e-tirads-category>
        {label}
      </p>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">Оценочный риск малигнизации: {risk}</p>
    </div>
  );
}

export function EuResultCard({ result }: { result: EuTiradsResult | null }) {
  const title = "EU-TIRADS · результат";
  if (!result) return <Pending title={title} text="Выберите состав узла, чтобы начать оценку." />;
  if (result.status === "invalid") {
    return <Pending title={title} text={`Проверьте ввод: ${result.errors.map((e) => e.messageRu).join(" ")}`} />;
  }
  if (result.status === "incomplete") {
    return <Pending title={title} text={`Не хватает данных: ${result.missing.map((m) => FIELD_RU[m] ?? m).join(", ")}. ${result.messageRu}`} />;
  }
  const [code, name] = result.categoryLabelRu.split(" · ");
  return (
    <Shell title={title}>
      <CategoryBadge label={code} risk={result.malignancyRiskRu} />
      <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{name}</p>
      <ul className="list-inside list-disc text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        {result.rationaleRu.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <Management
        fna={result.management.fna}
        reason={result.management.fnaReasonRu}
        followUp={result.management.followUpRu}
        source={`${result.management.source.citation}`}
      />
      <Warnings items={result.warnings.map((w) => w.messageRu)} />
    </Shell>
  );
}

export function AcrResultCard({ result }: { result: AcrStrictResult | null }) {
  const title = "ACR TI-RADS · результат";
  if (!result) return <Pending title={title} text="Выберите состав узла, чтобы начать подсчёт баллов." />;
  if (result.status === "invalid") {
    return <Pending title={title} text={`Проверьте ввод: ${result.errors.map((e) => e.messageRu).join(" ")}`} />;
  }
  if (result.status === "incomplete") {
    return <Pending title={title} text={`Не хватает данных: ${result.missing.map((m) => FIELD_RU[m] ?? m).join(", ")}. ${result.messageRu}`} />;
  }
  const r = result.result;
  const b = r.scoreBreakdown;
  return (
    <Shell title={title}>
      <CategoryBadge label={`${r.category} · ${r.totalPoints} б.`} risk={r.malignancyRisk} />
      <p className="text-sm font-semibold text-[var(--clinical-foreground)]">{r.categoryLabel}</p>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Баллы: состав {b.composition} · эхогенность {b.echogenicity} · форма {b.shape} · контуры {b.margin} · включения {b.echogenicFoci}
      </p>
      <Management
        fna={result.management.fna}
        reason={result.management.fnaReasonRu}
        followUp={result.management.followUpRu}
        source={result.source.citation}
      />
      <Warnings items={result.warnings.map((w) => w.messageRu)} />
    </Shell>
  );
}
