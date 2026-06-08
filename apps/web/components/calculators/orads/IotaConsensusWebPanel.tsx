import type { IotaConsensusResult } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

export function IotaConsensusWebPanel({ consensus }: { consensus: IotaConsensusResult }) {
  const ready = consensus.readiness === "complete";
  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        ready ? "border-teal-200 bg-teal-50/50" : "border-amber-200 bg-amber-50/50",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-violet-800">Консенсус IOTA 2026</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-black",
            ready ? "bg-teal-100 text-teal-900" : "bg-amber-100 text-amber-900",
          )}
        >
          {ready ? "заполнено" : "неполно"}
        </span>
      </div>
      <p className="mt-2 text-lg font-black">{consensus.harmonizedCategory}</p>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">{consensus.versionLabel}</p>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="font-bold">Модифицированный доброкачественный дескриптор</p>
          <p className="text-[var(--clinical-foreground-muted)]">
            {consensus.modifiedBenignDescriptor.label}. {consensus.modifiedBenignDescriptor.note}
          </p>
        </div>
        <div>
          <p className="font-bold">Двухэтапная стратегия</p>
          <p className="text-[var(--clinical-foreground-muted)]">{consensus.twoStepStrategy.route}</p>
        </div>
        <ul className="divide-y rounded-lg border border-[var(--clinical-border)] bg-white/80">
          {consensus.adnexVariables.map((item) => (
            <li key={item.key} className="flex justify-between gap-2 px-3 py-2 text-xs">
              <span className="font-semibold">{item.label}</span>
              <span className={item.complete ? "text-slate-800" : "text-amber-700"}>{item.value}</span>
            </li>
          ))}
        </ul>
        {consensus.missingFields.length ? (
          <p className="text-xs text-amber-800">
            Для полной IOTA-структуры: {consensus.missingFields.join(", ")}
          </p>
        ) : null}
        <p className="text-xs italic text-[var(--clinical-foreground-muted)]">{consensus.clinicalNote}</p>
      </div>
    </section>
  );
}
