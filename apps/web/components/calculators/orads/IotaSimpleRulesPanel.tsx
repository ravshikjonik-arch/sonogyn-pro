"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  IOTA_BENIGN_DESCRIPTORS,
  IOTA_MALIGNANT_DESCRIPTORS,
  ORADS_US_SOLID_COMPONENT_MIN_MM,
  ORADS_US_VERSION,
  SUPPLEMENTARY_READING,
  evaluateIotaSimpleRules,
  type IotaSimpleCode,
} from "@repo/adnex-education";

import { CalcChip } from "@/components/calculators/shared/calc-ui";
import { cn } from "@/lib/utils/cn";

function toggle(list: IotaSimpleCode[], code: IotaSimpleCode): IotaSimpleCode[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

export function IotaSimpleRulesPanel() {
  const [benign, setBenign] = useState<IotaSimpleCode[]>([]);
  const [malignant, setMalignant] = useState<IotaSimpleCode[]>([]);

  const result = useMemo(() => evaluateIotaSimpleRules(benign, malignant), [benign, malignant]);

  const tone =
    result.verdict === "benign"
      ? "border-emerald-300 bg-emerald-50/60"
      : result.verdict === "malignant"
        ? "border-rose-300 bg-rose-50/60"
        : "border-amber-300 bg-amber-50/60";

  return (
    <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-800">
            IOTA Simple Rules · {ORADS_US_VERSION}
          </p>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            IOTA group. Солидный компонент ≥{ORADS_US_SOLID_COMPONENT_MIN_MM} мм — порог O-RADS US.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold text-emerald-800">Доброкачественные (B)</p>
          <div className="flex flex-wrap gap-2">
            {IOTA_BENIGN_DESCRIPTORS.map((d) => (
              <CalcChip
                key={d.code}
                label={`${d.code}: ${d.labelRu}`}
                selected={benign.includes(d.code)}
                onClick={() => setBenign((prev) => toggle(prev, d.code))}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-rose-800">Злокачественные (M)</p>
          <div className="flex flex-wrap gap-2">
            {IOTA_MALIGNANT_DESCRIPTORS.map((d) => (
              <CalcChip
                key={d.code}
                label={`${d.code}: ${d.labelRu}`}
                selected={malignant.includes(d.code)}
                onClick={() => setMalignant((prev) => toggle(prev, d.code))}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={cn("mt-4 rounded-xl border p-3 text-sm", tone)}>
        <p className="font-bold">{result.summaryRu}</p>
        {result.supplementaryNote ?? result.ozerskayaNote ? (
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            {result.supplementaryNote ?? result.ozerskayaNote}
          </p>
        ) : null}
      </div>

      {SUPPLEMENTARY_READING[0]?.href ? (
        <p className="mt-3 text-xs">
          <Link href={SUPPLEMENTARY_READING[0].href} className="font-semibold text-[var(--clinical-primary-deep)] hover:underline">
            Доп. литература с эхограммами →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
