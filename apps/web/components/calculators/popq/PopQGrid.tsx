"use client";

import { POINT_HINTS, POPQ_VALUE_OPTIONS, type PopQPointKey } from "@/lib/popq";
import { cn } from "@/lib/utils/cn";

type Props = {
  values: Record<PopQPointKey, string>;
  uterusPresent: boolean;
  onChange: (key: PopQPointKey, value: string) => void;
};

function Cell({
  pointKey,
  value,
  onChange,
  className,
}: {
  pointKey: PopQPointKey;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-[var(--clinical-border)] bg-white p-2 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-1">
        <span className="text-sm font-black text-[var(--clinical-primary-deep)]">{pointKey}</span>
        <button
          type="button"
          title={POINT_HINTS[pointKey]}
          className="text-xs text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-primary)]"
          aria-label={`Подсказка ${pointKey}`}
        >
          ?
        </button>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-bold"
      >
        <option value="">—</option>
        {POPQ_VALUE_OPTIONS.map((n) => (
          <option key={n} value={String(n)}>
            {n} см
          </option>
        ))}
      </select>
      <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-[var(--clinical-foreground-muted)]">
        {POINT_HINTS[pointKey]}
      </p>
    </div>
  );
}

/** Сетка 3×3 в духе AUGS POP-Q Tool. */
export function PopQGrid({ values, uterusPresent, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Cell pointKey="Aa" value={values.Aa} onChange={(v) => onChange("Aa", v)} />
      <Cell pointKey="Ba" value={values.Ba} onChange={(v) => onChange("Ba", v)} />
      <Cell pointKey="C" value={values.C} onChange={(v) => onChange("C", v)} />

      <Cell pointKey="GH" value={values.GH} onChange={(v) => onChange("GH", v)} />
      <Cell pointKey="PB" value={values.PB} onChange={(v) => onChange("PB", v)} />
      <Cell pointKey="TVL" value={values.TVL} onChange={(v) => onChange("TVL", v)} />

      <Cell pointKey="Ap" value={values.Ap} onChange={(v) => onChange("Ap", v)} />
      <Cell pointKey="Bp" value={values.Bp} onChange={(v) => onChange("Bp", v)} />
      {uterusPresent ? (
        <Cell pointKey="D" value={values.D} onChange={(v) => onChange("D", v)} />
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs text-slate-500">
          D — N/A
          <br />
          (после гистерэктомии)
        </div>
      )}
    </div>
  );
}
