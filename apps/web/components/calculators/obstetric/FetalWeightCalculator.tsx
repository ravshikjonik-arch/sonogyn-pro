"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  CLINICAL_EFW_DISCLAIMER,
  efwMaternalAnthropometry,
  efwRudakov,
  estimateFetalWeightAll,
  type FetalPresentation,
} from "@repo/medical-calculations";

type Tab = "hadlock" | "rudakov" | "maternal";

export function FetalWeightCalculator() {
  const [tab, setTab] = useState<Tab>("hadlock");
  const [bpd, setBpd] = useState("");
  const [hc, setHc] = useState("");
  const [ac, setAc] = useState("");
  const [fl, setFl] = useState("");
  const [vdm, setVdm] = useState("");
  const [ozh, setOzh] = useState("");
  const [presentation, setPresentation] = useState<FetalPresentation>("cephalic");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [nulliparous, setNulliparous] = useState(true);

  const num = (s: string) => {
    const v = Number.parseFloat(s.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  };

  const hadlockResults = useMemo(
    () =>
      estimateFetalWeightAll({
        bpdMm: num(bpd),
        hcMm: num(hc),
        acMm: num(ac),
        flMm: num(fl),
      }),
    [bpd, hc, ac, fl],
  );

  const rudakov = useMemo(() => {
    const v = num(vdm);
    const o = num(ozh);
    if (v == null || o == null) return null;
    return efwRudakov({ fundalHeightCm: v, abdominalCircumferenceCm: o, presentation });
  }, [vdm, ozh, presentation]);

  const maternal = useMemo(() => {
    const w = num(weight);
    const h = num(height);
    const v = num(vdm);
    if (w == null || h == null || v == null) return null;
    return efwMaternalAnthropometry({
      maternalWeightKg: w,
      maternalHeightCm: h,
      fundalHeightCm: v,
      nulliparous,
    });
  }, [weight, height, vdm, nulliparous]);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calculators/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto max-w-3xl space-y-2">
        <Badge variant="outline">EFW · масса плода</Badge>
        <h1 className="text-3xl font-black tracking-tight">Предполагаемая масса плода</h1>
      </header>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-[var(--clinical-muted)] p-1">
          {(
            [
              ["hadlock", "Hadlock (УЗИ)"],
              ["rudakov", "Рудаков"],
              ["maternal", "Антропометрия матери"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-semibold sm:text-sm",
                tab === id ? "bg-[var(--clinical-card)] shadow-sm" : "text-[var(--clinical-foreground-muted)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "hadlock" ? (
          <div className="space-y-4">
            <CalcStepCard title="Фетометрия, мм">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="BPD" value={bpd} onChange={setBpd} />
                <Field label="HC" value={hc} onChange={setHc} />
                <Field label="AC" value={ac} onChange={setAc} />
                <Field label="FL" value={fl} onChange={setFl} />
              </div>
            </CalcStepCard>
            {hadlockResults.length > 0 ? (
              <EfwBox results={hadlockResults.map((r) => ({ grams: r.grams, label: r.label }))} />
            ) : null}
          </div>
        ) : null}
        {tab === "rudakov" ? (
          <div className="space-y-4">
            <CalcStepCard title="Наружный осмотр">
              <Field label="ВДМ, см" value={vdm} onChange={setVdm} />
              <Field label="ОЖ, см" value={ozh} onChange={setOzh} />
              <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Предлежание</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["cephalic", "Головное"],
                    ["breech", "Тазовое"],
                    ["transverse", "Поперечное"],
                  ] as const
                ).map(([id, label]) => (
                  <CalcChip key={id} label={label} selected={presentation === id} onClick={() => setPresentation(id)} />
                ))}
              </div>
            </CalcStepCard>
            {rudakov ? <EfwBox results={[{ grams: rudakov.grams, label: rudakov.formula }]} note={rudakov.note} /> : null}
          </div>
        ) : null}
        {tab === "maternal" ? (
          <div className="space-y-4">
            <CalcStepCard title="Антропометрия матери">
              <Field label="Вес, кг" value={weight} onChange={setWeight} />
              <Field label="Рост, см" value={height} onChange={setHeight} />
              <Field label="ВДМ, см" value={vdm} onChange={setVdm} />
              <CalcChip
                label={nulliparous ? "Первые роды" : "Повторные роды"}
                selected={nulliparous}
                onClick={() => setNulliparous((v) => !v)}
              />
            </CalcStepCard>
            {maternal ? (
              <EfwBox results={[{ grams: maternal.grams, label: maternal.formula }]} note={maternal.note} />
            ) : null}
          </div>
        ) : null}
        <p className="mt-6 text-center text-xs text-[var(--clinical-foreground-muted)]">{CLINICAL_EFW_DISCLAIMER}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <Input className="mt-1" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function EfwBox({ results, note }: { results: { grams: number; label: string }[]; note?: string }) {
  return (
    <section className="rounded-2xl border border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/20 p-5">
      {results.map((r) => (
        <div key={r.label} className="mb-2">
          <p className="text-2xl font-black">{r.grams} г</p>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">{r.label}</p>
        </div>
      ))}
      {note ? <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{note}</p> : null}
    </section>
  );
}
